import {
    Box, Grid, GridItem, Stack, useColorMode, useColorModeValue,
    VStack, Icon, Text, Flex
} from "@chakra-ui/react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useLocation, useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { BsPostcard } from "react-icons/bs";

import Tabs from "@components/Tabs";
import Post from "@components/Post";
import PostSkeleton from "@components/PostSkeleton";

import userAtom from "../atoms/userAtom";
import useShowToast from "@hooks/useShowToast";
import api from "../services/api.js";
import { followersAtom, followingAtom } from "../atoms/followAtoms.js";

// Constants
const INITIAL_POSTS_LIMIT = 10;
const SCROLL_POSTS_LIMIT = 10;
const SCROLL_THRESHOLD = 300;
const DEBOUNCE_DELAY = 100;
const CACHE_KEY = "feed_cache";

// Custom hooks
const useFeedCache = () => {
    const getCache = useCallback((feedType) => {
        try {
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const parsedCache = JSON.parse(cached);
            return parsedCache.feedType === feedType ? parsedCache : null;
        } catch {
            return null;
        }
    }, []);

    const setCache = useCallback((data) => {
        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {
            // Ignore cache errors
        }
    }, []);

    const clearCache = useCallback(() => {
        try {
            sessionStorage.removeItem(CACHE_KEY);
        } catch {
            // Ignore cache errors
        }
    }, []);

    return { getCache, setCache, clearCache };
};

const HomePage = () => {
    // Recoil state
    const currentUser = useRecoilValue(userAtom);
    const setFollowing = useSetRecoilState(followingAtom);
    const setFollower = useSetRecoilState(followersAtom);

    // Hooks
    const showToast = useShowToast();
    const { colorMode } = useColorMode();
    const location = useLocation();
    const navigate = useNavigate();
    const { getCache, setCache, clearCache } = useFeedCache();

    // Local state
    const [feedType, setFeedType] = useState("propose");
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [refreshKey, setRefreshKey] = useState(Date.now());

    // Memoized values
    const emptyBg = useColorModeValue('white', 'gray.dark');
    const emptyBorder = useColorModeValue('gray.200', 'gray.700');
    const headerBg = useColorModeValue("gray.50", "#101010");

    const tabs = useMemo(() => [
        { value: "propose", label: "For you" },
        { value: "followed", label: "Following", requireAuth: true },
    ], []);

    const emptyStateMessage = useMemo(() => {
        return feedType === "followed"
            ? "Follow your friends to see the article here!"
            : "There are no suggested articles yet. Please come back later!";
    }, [feedType]);

    // Update user following/followers when user changes
    useEffect(() => {
        if (currentUser) {
            setFollowing(currentUser.following);
            setFollower(currentUser.followers);
        } else {
            setFollowing([]);
            setFollower([]);
        }
    }, [currentUser, setFollowing, setFollower]);

    // Fetch posts function with better error handling
    const fetchPosts = useCallback(async (feedType, pageNum = 1, isInit = false) => {
        if ((loading || loadingMore) && !isInit) return;
        if (!hasMore && !isInit) return;

        const controller = new AbortController();
        isInit ? setLoading(true) : setLoadingMore(true);

        try {
            const endpoint = feedType === "propose" ? "/api/posts/feed" : "/api/posts/followed";
            const limit = isInit ? INITIAL_POSTS_LIMIT : SCROLL_POSTS_LIMIT;
            const params = { page: pageNum, limit };

            const res = await api.get(endpoint, { params, signal: controller.signal });
            const newPosts = res.data?.posts || [];

            setPosts(prev => {
                if (isInit) return newPosts;

                // Remove duplicates more efficiently
                const existingIds = new Set(prev.map(p => p._id));
                const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p._id));
                return [...prev, ...uniqueNewPosts];
            });

            setHasMore(newPosts.length >= limit);
            if (isInit) setInitialLoadDone(true);

        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Failed to fetch posts:', err);
                showToast?.("Failed to load posts", "error");
            }
        } finally {
            isInit ? setLoading(false) : setLoadingMore(false);
        }

        return () => controller.abort();
    }, [loading, loadingMore, hasMore, showToast]);

    // Load posts with cache support
    useEffect(() => {
        const cache = getCache(feedType);

        if (cache?.posts?.length) {
            setPosts(cache.posts);
            setPage(cache.page);
            setHasMore(cache.posts.length >= INITIAL_POSTS_LIMIT);
            setInitialLoadDone(true);

            // Restore scroll position
            if (cache.scrollY) {
                setTimeout(() => {
                    window.scrollTo({ top: cache.scrollY, behavior: "instant" });
                }, 50);
            }

            clearCache();
            return;
        }

        // Reset state and fetch fresh data
        setPosts([]);
        setPage(1);
        setHasMore(true);
        setInitialLoadDone(false);
        fetchPosts(feedType, 1, true);
    }, [feedType, refreshKey]); // Removed getCache, clearCache, fetchPosts from deps

    // Optimized infinite scroll
    useEffect(() => {
        const handleScroll = debounce(() => {
            const { innerHeight, scrollY } = window;
            const { scrollHeight } = document.documentElement;
            const bottom = innerHeight + scrollY >= scrollHeight - SCROLL_THRESHOLD;

            if (bottom && !loading && !loadingMore && hasMore && initialLoadDone) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchPosts(feedType, nextPage);
            }
        }, DEBOUNCE_DELAY, { leading: true, trailing: true });

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [feedType, loading, loadingMore, hasMore, initialLoadDone, page]); // Removed fetchPosts from deps

    // Handle location state changes
    useEffect(() => {
        const { state } = location;

        if (state?.refresh) {
            setRefreshKey(Date.now());
            window.scrollTo({ top: 0, behavior: "smooth" });
            navigate(location.pathname, { replace: true, state: {} });
        }

        // Handle post page redirect
        if (state?.fromPostPage && state?.postId && initialLoadDone) {
            const element = document.getElementById(`post-${state.postId}`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate, initialLoadDone]);

    // Memoized post update handler
    const handlePostUpdate = useCallback((updatedPost) => {
        if (!updatedPost?._id) return;

        setPosts(prev => prev.map(p =>
            p._id === updatedPost._id ? updatedPost : p
        ));
    }, []);

    // Handle tab clicks with refresh logic
    const handleTabClick = useCallback((newTab) => {
        if (newTab === feedType) {
            setRefreshKey(Date.now());
        } else {
            // Save current state to cache before switching
            if (posts.length > 0) {
                setCache({
                    posts,
                    page,
                    scrollY: window.scrollY,
                    feedType
                });
            }
            setFeedType(newTab);
        }
    }, [feedType, posts, page, setCache]);

    // Render loading skeleton
    const renderLoadingSkeleton = useMemo(() => (
        <Stack spacing={4} mt={4}>
            {Array.from({ length: 3 }, (_, i) => (
                <PostSkeleton key={i} />
            ))}
        </Stack>
    ), []);

    // Render empty state
    const renderEmptyState = useMemo(() => (
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
                <Text fontSize="lg" fontWeight="bold" color="gray.500">
                    No posts found
                </Text>
                <Text fontSize="md" color="gray.500" textAlign="center">
                    {emptyStateMessage}
                </Text>
            </VStack>
        </Box>
    ), [emptyBg, emptyBorder, emptyStateMessage]);

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
                    {/* Fixed header */}
                    <Box
                        position="fixed"
                        top="0"
                        left="0"
                        right="0"
                        zIndex="100"
                        bg={headerBg}
                        pt={3}
                        pb={2}
                        w="full"
                        maxW={{ base: "750px", xl: "850px" }}
                        mx="auto"
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

                    {/* Main content */}
                    <Box pt="70px">
                        {/* Loading state */}
                        {loading && posts.length === 0 && renderLoadingSkeleton}

                        {/* Empty state */}
                        {!loading && posts.length === 0 && renderEmptyState}

                        {/* Posts list */}
                        {posts.length > 0 && (
                            <Stack spacing={6}>
                                {posts.map(post => (
                                    <Post
                                        key={post._id}
                                        type={feedType}
                                        post={post}
                                        postedBy={post.postedBy}
                                        onPostUpdate={handlePostUpdate}
                                        referrer={{ url: "/", page: "home" }}
                                    />
                                ))}
                            </Stack>
                        )}

                        {/* Load more indicator */}
                        {loadingMore && (
                            <Stack spacing={4} mt={4}>
                                <PostSkeleton />
                            </Stack>
                        )}

                        {/* End of posts indicator */}
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