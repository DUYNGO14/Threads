import { useEffect, useState, useCallback } from "react";
import { Spinner, Box, Flex, Text, useColorModeValue, Stack } from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import { useRecoilValue } from "recoil";
import SuggestedUsers from "../components/SuggestedUsers";
import Post from "../components/Post";
import Tabs from "../components/Tabs";
import { debounce } from "lodash";
import userAtom from "../atoms/userAtom";
import PostSkeleton from "../components/PostSkeleton";

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
    const bgColor = useColorModeValue('white', 'gray.dark');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

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
    }, [feedType]);

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
        { value: "propose", label: "Propose" },
        { value: "followed", label: "Followed", requireAuth: true },
    ];
    return (
        <Flex gap={10} alignItems={"flex-start"}>
            <Box flex={70}>
                <Tabs tabs={myTabs} onTabChange={setFeedType} initialTab={feedType} requireAuth={true} />
                <Box minH="calc(100vh - 200px)">
                    {!loading && posts[feedType].length === 0 && (
                        <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            height="50vh"
                            textAlign="center"
                            color="gray.500"
                        >
                            <Text fontSize="xl" fontWeight="bold">
                                Không có bài viết nào
                            </Text>
                            <Text fontSize="md">Hãy theo dõi bạn bè để xem bài viết tại đây!</Text>
                        </Box>
                    )}

                    {loading && posts[feedType].length === 0 && (
                        <Stack spacing={4} mt={4}>
                            <PostSkeleton />
                            <PostSkeleton />
                            <PostSkeleton />
                        </Stack>
                    )}

                    {posts[feedType].map((post) => (
                        <Post
                            key={post._id}
                            post={post}
                            postedBy={post?.postedBy}
                            onPostUpdate={updatePostInFeed}
                        />
                    ))}

                    {loadingMore && (
                        <Stack spacing={4} mt={4}>
                            <PostSkeleton />
                        </Stack>
                    )}

                    {!hasMore[feedType] && posts[feedType].length > 0 && (
                        <Flex justifyContent={"center"} mb={4} color="gray.500">
                            <p>📌 Đã hết bài viết</p>
                        </Flex>
                    )}
                </Box>
            </Box>
            <Box w="300px" minW="300px" display={{ base: "none", md: "block" }} position="sticky" top="20px">
                {currentUser ? (
                    <SuggestedUsers />
                ) : (
                    <Box
                        p={4}
                        bg={bgColor}
                        borderRadius="md"
                        border="1px solid"
                        borderColor={borderColor}
                    >
                        <Text fontSize="lg" fontWeight="bold" mb={4} textAlign={"center"}>
                            Đăng nhập hoặc đăng ký Threads
                        </Text>
                        <Box py={2}>
                            <Text color="gray.600" fontSize="sm" mb={4} textAlign={"center"} >
                                Xem mọi người đang nói về điều gì và tham gia cuộc trò chuyện.
                            </Text>
                        </Box>
                    </Box>
                )}
            </Box>
        </Flex>
    );
};

export default HomePage;
