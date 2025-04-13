import { useEffect, useState, useCallback } from "react";
import { Spinner, Box, Flex, Text, useColorModeValue, Stack, VStack, Icon, useColorMode, Grid, GridItem } from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import { useRecoilValue } from "recoil";
import SuggestedUsers from "../components/SuggestedUsers";
import Post from "../components/Post";
import Tabs from "../components/Tabs";
import { debounce } from "lodash";
import userAtom from "../atoms/userAtom";
import PostSkeleton from "../components/PostSkeleton";
import { BsPostcard } from "react-icons/bs";
import RightSidebar from "../components/RightSidebar";

const INITIAL_POSTS_LIMIT = 5;
const SCROLL_POSTS_LIMIT = 10;

const HomePage = () => {
    const [feedType, setFeedType] = useState("propose");
    const [posts, setPosts] = useState({ propose: [], followed: [] });
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState({ propose: 1, followed: 1 });
    const [hasMore, setHasMore] = useState({ propose: true, followed: true });
    const [initialLoadComplete, setInitialLoadComplete] = useState({ propose: false, followed: false });

    const showToast = useShowToast();
    const currentUser = useRecoilValue(userAtom);
    const { colorMode } = useColorMode();
    const emptyStateBg = useColorModeValue('white', 'gray.dark');
    const emptyStateBorder = useColorModeValue('gray.200', 'gray.700');

    const updatePostInFeed = useCallback((updatedPost) => {
        if (!updatedPost) {
            // Nếu updatedPost là null (post đã bị xóa), xóa post khỏi cả hai loại feed
            setPosts(prev => ({
                propose: prev.propose.filter(p => p._id !== updatedPost?._id),
                followed: prev.followed.filter(p => p._id !== updatedPost?._id)
            }));
            return;
        }

        setPosts(prev => ({
            ...prev,
            [feedType]: prev[feedType].map(post =>
                post._id === updatedPost._id ? updatedPost : post
            )
        }));
    }, [feedType, setPosts]);

    const getFeedPost = useCallback(async (feed, pageNumber, isInitialLoad = false) => {
        if ((loading || loadingMore) && !isInitialLoad) return;
        if (!hasMore[feed]) return;

        if (isInitialLoad) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const endpoint = feed === "propose" ? "/api/posts/propose" : "/api/posts/followed";
            const limit = isInitialLoad ? INITIAL_POSTS_LIMIT : SCROLL_POSTS_LIMIT;
            const res = await fetch(`${endpoint}?page=${pageNumber}&limit=${limit}`);
            const data = await res.json();

            if (data.error) {
                showToast("Lỗi", data.error, "error");
                return;
            }

            const processedPosts = data.posts.map(post => ({
                ...post,
                postedBy: post.postedBy || null
            }));

            setPosts((prev) => ({
                ...prev,
                [feed]: isInitialLoad
                    ? processedPosts
                    : [...prev[feed], ...processedPosts].reduce((acc, post) => {
                        if (!acc.some((p) => p._id === post._id)) acc.push(post);
                        return acc;
                    }, []),
            }));

            setHasMore((prev) => ({
                ...prev,
                [feed]: processedPosts.length > 0 && processedPosts.length >= limit
            }));

            if (isInitialLoad && processedPosts.length >= INITIAL_POSTS_LIMIT) {
                setInitialLoadComplete(prev => ({ ...prev, [feed]: true }));
            }
        } catch (error) {
            showToast("Lỗi", error.message, "error");
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            } else {
                setLoadingMore(false);
            }
        }
    }, [loading, loadingMore, hasMore, showToast, setPosts, setHasMore, setInitialLoadComplete, setLoading, setLoadingMore]);

    // Khi đổi tab, reset state và load lại từ đầu
    useEffect(() => {
        setPosts({ propose: [], followed: [] });
        setPage({ propose: 1, followed: 1 });
        setHasMore({ propose: true, followed: true });
        setInitialLoadComplete({ propose: false, followed: false });
        getFeedPost(feedType, 1, true);
    }, [feedType]);  // Mỗi khi `feedType` thay đổi, dữ liệu sẽ được tải lại


    const handleScroll = useCallback(
        debounce(() => {
            const scrollPosition = window.innerHeight + window.scrollY;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollThreshold = 300; // Tăng khoảng cách để load sớm hơn

            if (scrollPosition >= documentHeight - scrollThreshold) {
                if (!loading && !loadingMore && hasMore[feedType] && initialLoadComplete[feedType]) {
                    setPage((prev) => {
                        const newPage = prev[feedType] + 1;
                        getFeedPost(feedType, newPage, false);
                        return { ...prev, [feedType]: newPage };
                    });
                }
            }
        }, 100),
        [loading, loadingMore, hasMore, feedType, initialLoadComplete]
    );

    useEffect(() => {
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    // Thêm useEffect để theo dõi thay đổi của posts
    useEffect(() => {
        if (posts[feedType].length >= INITIAL_POSTS_LIMIT && !initialLoadComplete[feedType]) {
            setInitialLoadComplete(prev => ({ ...prev, [feedType]: true }));
        }
    }, [posts, feedType, initialLoadComplete]);
    const myTabs = [
        { value: "propose", label: "For you" },
        { value: "followed", label: "Following", requireAuth: true },
    ];
    return (
        <Box position="relative">
            <Grid
                templateAreas={`"header header"`}
                templateColumns={{ base: "1fr", xl: "minmax(auto, 1000px) 320px" }}
                gap={6}
                alignItems="flex-start"
                maxW="1600px"
                mx="auto"
            >
                {/* Phần Bài Viết */}
                <GridItem area={'header'}>
                    <Box
                        position="fixed"
                        top="0"
                        left="0"
                        w="full"
                        bg={colorMode === "dark" ? "#101010" : "gray.50"}
                        zIndex="100"
                        borderBottom="1px"
                        borderColor={colorMode === "dark" ? "whiteAlpha.100" : "gray.200"}
                        backdropFilter="blur(12px)"
                        py={2}
                    >
                        <Tabs tabs={myTabs} onTabChange={setFeedType} initialTab={feedType} requireAuth={true} />
                    </Box>
                    <Box height="60px" /> {/* Thêm khoảng trống tránh nội dung bị che mất */}
                </GridItem>
                <GridItem>
                    {/* Danh sách bài viết */}
                    <Box minH="calc(100vh - 200px)" overflowY="auto" w="full">
                        {posts[feedType].length === 0 && !loading && (
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                                minH="50vh"
                                bg={emptyStateBg}
                                borderRadius="xl"
                                p={6}
                                mt={4}
                                borderWidth="1px"
                                borderColor={emptyStateBorder}
                            >
                                <VStack spacing={4}>
                                    <Icon as={BsPostcard} boxSize={10} color="gray.500" />
                                    <Text fontSize="lg" fontWeight="bold" color="gray.500">
                                        Không có bài viết nào
                                    </Text>
                                    <Text fontSize="md" color="gray.500" textAlign="center">
                                        {feedType === "followed"
                                            ? "Hãy theo dõi bạn bè để xem bài viết tại đây!"
                                            : "Chưa có bài viết nào được đề xuất. Hãy quay lại sau nhé!"}
                                    </Text>
                                </VStack>
                            </Box>
                        )}

                        {loading && posts[feedType].length === 0 && (
                            <Stack spacing={4} mt={4}>
                                <PostSkeleton />
                                <PostSkeleton />
                                <PostSkeleton />
                            </Stack>
                        )}

                        <Stack spacing={6}>
                            {posts[feedType].map((post) => (
                                <Post key={post._id} post={post} postedBy={post?.postedBy} onPostUpdate={updatePostInFeed} />
                            ))}
                        </Stack>

                        {loadingMore && (
                            <Stack spacing={4} mt={4}>
                                <PostSkeleton />
                            </Stack>
                        )}

                        {!hasMore[feedType] && posts[feedType].length > 0 && (
                            <Flex justifyContent="center" mb={4} color="gray.500">
                                <Text fontSize="sm">📌No more posts</Text>
                            </Flex>
                        )}
                    </Box>
                </GridItem>

                {/* Phần Gợi Ý Người Dùng */}
                <GridItem
                    display={{ base: "none", xl: "block" }}
                    position="sticky"
                    top="20px"
                    maxH="calc(100vh - 40px)"
                    overflowY="auto"
                    p={2}
                    w="250px"

                >
                    {currentUser && <SuggestedUsers />}
                </GridItem>
            </Grid>
        </Box>
    );
};

export default HomePage;
