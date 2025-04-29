import {
    Box, Grid, GridItem, Stack, Spinner, useColorMode, useColorModeValue,
    VStack, Icon, Text, Flex
} from "@chakra-ui/react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRecoilValue } from "recoil";
import { useLocation, useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { BsPostcard } from "react-icons/bs";

import Tabs from "../components/Tabs";
import Post from "../components/Post";
import PostSkeleton from "../components/PostSkeleton";

import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import api from "../services/api.js";
const INITIAL_POSTS_LIMIT = 5;
const SCROLL_POSTS_LIMIT = 5;

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


    const tabs = [
        { value: "propose", label: "For you" },
        { value: "followed", label: "Following", requireAuth: true },
    ];

    const fetchPosts = useCallback(async (pageNum = 1, isInit = false) => {
        const controller = new AbortController();
        const signal = controller.signal;

        if ((loading || loadingMore) && !isInit) return;
        if (!hasMore && !isInit) return;

        isInit ? setLoading(true) : setLoadingMore(true);

        try {
            const endpoint = feedType === "propose" ? "/api/posts/propose" : "/api/posts/followed";
            const limit = isInit ? INITIAL_POSTS_LIMIT : SCROLL_POSTS_LIMIT;

            const res = await api.get(`${endpoint}?page=${pageNum}&limit=${limit}`, { signal });
            const data = await res.data;
            if (data.error) {
                showToast("Lỗi", data.error, "error");
                return;
            }

            const newPosts = data.posts || [];
            setPosts(prev => isInit ? newPosts : [...prev, ...newPosts].filter((p, i, self) => i === self.findIndex(x => x._id === p._id)));
            setHasMore(newPosts.length >= limit);
            if (isInit) setInitialLoadDone(true);

        } catch (err) {
            if (err.name !== "AbortError") {
                showToast("Lỗi", err.message, "error");
            }
        } finally {
            isInit ? setLoading(false) : setLoadingMore(false);
        }

        return () => controller.abort();
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
        const handleScroll = debounce(() => {
            const bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300;
            if (bottom && !loading && !loadingMore && hasMore && initialLoadDone) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchPosts(nextPage);
            }
        }, 100, { leading: true, trailing: true });

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [loading, loadingMore, hasMore, initialLoadDone, page, fetchPosts]);

    useEffect(() => {
        if (location.state?.refresh) {
            setRefreshKey(Date.now()); // trigger reload
            window.scrollTo({ top: 0, behavior: "smooth" }); // cuộn về đầu trang
            navigate(location.pathname, { replace: true, state: {} }); // clear state
        }
    }, [location]);

    // Scroll đến post nếu được redirect từ trang post
    useEffect(() => {
        if (!location.state?.fromPostPage || !location.state?.postId) return;

        const handleScroll = () => {
            const el = document.getElementById(`post-${location.state.postId}`);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
            navigate(location.pathname, { replace: true, state: {} });
        };

        if (initialLoadDone) {
            handleScroll();
        }
    }, [initialLoadDone, location, navigate]);

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
                templateAreas={`"main"`}
                templateColumns="1fr"
                gap={8}
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
                        // borderBottom="1px"
                        // borderColor={colorMode === "dark" ? "whiteAlpha.100" : "gray.200"}
                        pt={3}
                        pb={2}
                        w="full"  // Ensure full width
                        maxW={{ base: "750px", xl: "850px" }} // Limit max width
                        mx="auto" // Center horizontally

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
                    <Box pt="70px" >
                        {loading && posts.length === 0 && (
                            <Stack spacing={4} mt={4}><PostSkeleton /><PostSkeleton /><PostSkeleton /></Stack>
                        )}

                        {!loading && posts.length === 0 && (
                            <Box
                                bg={emptyBg}
                                borderColor={emptyBorder}
                                borderWidth="1px"
                                borderRadius="xl"

                                mt={4}
                                minH="50vh"
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <VStack spacing={4}>
                                    <Icon as={BsPostcard} boxSize={10} color="gray.500" />
                                    <Text fontSize="lg" fontWeight="bold" color="gray.500">No </Text>
                                    <Text fontSize="md" color="gray.500" textAlign="center">
                                        {feedType === "followed"
                                            ? "Hãy theo dõi bạn bè để xem bài viết tại đây!"
                                            : "Chưa có bài viết nào được đề xuất. Hãy quay lại sau nhé!"}
                                    </Text>
                                </VStack>
                            </Box>
                        )}

                        <Stack spacing={6} >
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
            </Grid>
        </Box>

    );
};

export default HomePage;
