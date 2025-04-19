import {
    Box, Grid, GridItem, Stack, Spinner, useColorMode, useColorModeValue,
    VStack, Icon, Text, Flex,
    Button
} from "@chakra-ui/react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRecoilValue } from "recoil";
import { useLocation, useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { BsPostcard } from "react-icons/bs";

import Tabs from "../components/Tabs";
import Post from "../components/Post";
import PostSkeleton from "../components/PostSkeleton";
import SuggestedUsers from "../components/SuggestedUsers";

import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import { FaThreads } from "react-icons/fa6";

const INITIAL_POSTS_LIMIT = 10;
const SCROLL_POSTS_LIMIT = 10;

const HomePage = () => {
    const currentUser = useRecoilValue(userAtom);
    const showToast = useShowToast();
    const { colorMode } = useColorMode();
    const location = useLocation();
    const navigate = useNavigate();

    const [feedType, setFeedType] = useState("propose");
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [refreshKey, setRefreshKey] = useState(Date.now()); // Dùng để force reload

    const emptyBg = useColorModeValue('white', 'gray.dark');
    const emptyBorder = useColorModeValue('gray.200', 'gray.700');

    const scrollHandlerRef = useRef();

    const tabs = [
        { value: "propose", label: "For you" },
        { value: "followed", label: "Following", requireAuth: true },
    ];

    const fetchPosts = useCallback(async (pageNum = 1, isInit = false) => {
        if ((loading || loadingMore) && !isInit) return;
        if (!hasMore && !isInit) return;

        isInit ? setLoading(true) : setLoadingMore(true);

        try {
            const endpoint = feedType === "propose" ? "/api/posts/propose" : "/api/posts/followed";
            const limit = isInit ? INITIAL_POSTS_LIMIT : SCROLL_POSTS_LIMIT;

            const res = await fetch(`${endpoint}?page=${pageNum}&limit=${limit}`);
            const data = await res.json();

            if (data.error) {
                showToast("Lỗi", data.error, "error");
                return;
            }

            const newPosts = data.posts || [];

            setPosts(prev =>
                isInit
                    ? newPosts
                    : [...prev, ...newPosts].filter((post, i, self) =>
                        i === self.findIndex(p => p._id === post._id)
                    )
            );

            setHasMore(newPosts.length >= limit);
            if (isInit) setInitialLoadDone(true);

        } catch (err) {
            showToast("Lỗi", err.message, "error");
        } finally {
            isInit ? setLoading(false) : setLoadingMore(false);
        }
    }, [feedType, loading, loadingMore, hasMore]);

    // Load khi feedType hoặc refreshKey đổi
    useEffect(() => {


        setPosts([]);
        setPage(1);
        setHasMore(true);
        setInitialLoadDone(false);
        fetchPosts(1, true);
    }, [feedType, refreshKey]);

    // Infinite scroll
    useEffect(() => {
        scrollHandlerRef.current = debounce(() => {
            const bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300;
            if (bottom && !loading && !loadingMore && hasMore && initialLoadDone) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchPosts(nextPage);
            }
        }, 100);

        window.addEventListener("scroll", scrollHandlerRef.current);
        return () => window.removeEventListener("scroll", scrollHandlerRef.current);
    }, [loading, loadingMore, hasMore, initialLoadDone, page, fetchPosts]);

    // Scroll đến bài viết từ trang khác
    useEffect(() => {
        if (location.state?.fromPostPage && location.state?.postId) {
            if (posts.length > 0) {
                const el = document.getElementById(`post-${location.state.postId}`);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                    navigate(location.pathname, { replace: true, state: {} });
                }
            }
        }
    }, [location, navigate, feedType, posts]);

    const handlePostUpdate = useCallback((updatedPost) => {
        if (!updatedPost) return;
        setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
    }, []);

    // ✅ Khi click lại tab hiện tại → set lại refreshKey để trigger useEffect
    const handleTabClick = (newTab) => {
        if (newTab === feedType) {
            setRefreshKey(Date.now());
        } else {
            setFeedType(newTab);
        }
    };

    return (
        <Box position="relative">
            <Grid
                templateAreas={`"main aside"`}
                templateColumns={{ base: "1fr", xl: "minmax(auto, 1200px) 260px" }}
                gap={6}
                alignItems="flex-start"
                maxW="1600px"
                mx="auto"
            >
                <GridItem area="main">
                    <Box
                        position="fixed"
                        top="0"
                        left="0"
                        right="0"
                        zIndex="100"
                        bg={colorMode === "dark" ? "#101010" : "gray.50"}
                        borderBottom="1px"
                        borderColor={colorMode === "dark" ? "whiteAlpha.100" : "gray.200"}
                        pt={3}
                        pb={2}
                        px={4}
                    >
                        <Flex direction="column" align="center">
                            <Tabs
                                tabs={tabs}
                                onTabChange={handleTabClick}
                                initialTab={feedType}
                                requireAuth
                            />
                        </Flex>
                    </Box>

                    <Box pt="70px">
                        {loading && posts.length === 0 && (
                            <Stack spacing={4} mt={4}><PostSkeleton /><PostSkeleton /><PostSkeleton /></Stack>
                        )}

                        {!loading && posts.length === 0 && (
                            <Box
                                bg={emptyBg}
                                borderColor={emptyBorder}
                                borderWidth="1px"
                                borderRadius="xl"
                                p={6}
                                mt={4}
                                minH="50vh"
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <VStack spacing={4}>
                                    <Icon as={BsPostcard} boxSize={10} color="gray.500" />
                                    <Text fontSize="lg" fontWeight="bold" color="gray.500">Không có bài viết</Text>
                                    <Text fontSize="md" color="gray.500" textAlign="center">
                                        {feedType === "followed"
                                            ? "Hãy theo dõi bạn bè để xem bài viết tại đây!"
                                            : "Chưa có bài viết nào được đề xuất. Hãy quay lại sau nhé!"}
                                    </Text>
                                </VStack>
                            </Box>
                        )}

                        <Stack spacing={6}>
                            {posts.map(post => (
                                <Post
                                    key={post._id}
                                    post={post}
                                    postedBy={post.postedBy}
                                    onPostUpdate={handlePostUpdate}
                                    referrer={{ url: "/", page: "home" }}
                                />
                            ))}
                        </Stack>

                        {loadingMore && (
                            <Stack spacing={4} mt={4}>
                                <PostSkeleton />
                            </Stack>
                        )}

                        {!hasMore && posts.length > 0 && (
                            <Flex justifyContent="center" my={6} color="gray.500">
                                <Text fontSize="sm">📌 No more posts</Text>
                            </Flex>
                        )}
                    </Box>
                </GridItem>

                <GridItem area="aside" display={{ base: "none", xl: "block" }} pt={"70px"}>
                    {currentUser ? <SuggestedUsers /> : (
                        <Box
                            p={6}
                            bg={colorMode === "dark" ? "#101010" : "gray.50"}
                            borderRadius="xl"
                            border="1px solid"
                            borderColor={colorMode === "dark" ? "whiteAlpha.100" : "gray.200"}
                            textAlign="center"
                        >
                            <Text fontSize="xl" fontWeight="bold" mb={2}>
                                Log in or sign up to Threads
                            </Text>
                            <Text fontSize="sm" color="gray.400" mb={6}>
                                See what people are talking about and join the conversation.
                            </Text>
                            <Button
                                leftIcon={<Icon as={FaThreads} />}
                                bg="whiteAlpha.200"
                                _hover={{ bg: "whiteAlpha.300" }}
                                size="lg"
                                w="full"
                                fontWeight="bold"
                                color="white"
                                borderRadius="xl"
                                mb={4}
                                onClick={() => navigate("/auth")}
                            >
                                Login in now
                            </Button>
                            <Text fontSize="sm" color="gray.500" mt={2}>
                                Log in with username or email
                            </Text>
                        </Box>
                    )}
                </GridItem>
            </Grid>
        </Box>
    );
};

export default HomePage;
