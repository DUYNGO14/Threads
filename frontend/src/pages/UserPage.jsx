import { useEffect, useState, useCallback } from "react";
import UserHeader from "../components/UserHeader";
import { useParams } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";
import {
    Flex,
    Box,
    Text,
    Stack,
    useColorModeValue,
    GridItem,
    useColorMode,
    IconButton,
} from "@chakra-ui/react";
import Post from "../components/Post";
import useGetUserProfile from "../hooks/useGetUserProfile";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import PostSkeleton from "../components/PostSkeleton";
import NotFound from "../components/NotFound";
import Tabs from "../components/Tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { IoArrowBackOutline } from "react-icons/io5";
import api from "../services/api.js";
const POST_LIMIT = 10;

const UserPage = () => {
    const { username } = useParams();
    const showToast = useShowToast();
    const { user, loading } = useGetUserProfile();
    const [posts, setPosts] = useRecoilState(postsAtom);
    const [fetchingPosts, setFetchingPosts] = useState(false);
    const [feedType, setFeedType] = useState("threads");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const { colorMode } = useColorMode();
    const navigate = useNavigate();
    const location = useLocation();
    const [refreshKey, setRefreshKey] = useState(Date.now());
    const myTabs = [
        { value: "threads", label: "Threads" },
        { value: "reposts", label: "Reposts" },
    ];

    const updatePost = useCallback(
        (updatedPost) => {
            if (!updatedPost) {
                setPosts((prev) => prev.filter((p) => p._id !== updatedPost?._id));
                return;
            }

            if (
                feedType === "reposts" &&
                !updatedPost.repostedBy?.includes(user?._id)
            ) {
                setPosts((prev) => prev.filter((p) => p._id !== updatedPost._id));
                return;
            }

            setPosts((prev) =>
                prev.map((post) => (post._id === updatedPost._id ? updatedPost : post))
            );
        },
        [setPosts, feedType, user?._id]
    );

    const fetchPosts = useCallback(async () => {
        if (!user) return;
        setFetchingPosts(true);

        try {
            let endpoint =
                feedType === "threads"
                    ? `/api/posts/user/${username}?page=${page}&limit=${POST_LIMIT}`
                    : `/api/posts/reposts/${username}?page=${page}&limit=${POST_LIMIT}`;

            const res = await api.get(endpoint);
            const data = await res.data; // updated to use res.data

            if (!Array.isArray(data?.posts)) throw new Error("Invalid post data");

            setPosts((prev) => (page === 1 ? data.posts : [...prev, ...data.posts]));
            setHasMore(data.posts.length === POST_LIMIT);
        } catch (error) {
            showToast("Error", error.message, "error");
            if (page === 1) setPosts([]);
        } finally {
            setFetchingPosts(false);
        }
    }, [user, username, feedType, page, setPosts, showToast]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts, refreshKey]);

    const handleTabChange = (tab) => {
        setFeedType(tab);
        setPage(1);
        setHasMore(true);
        setPosts([]);
    };

    const loadMore = () => {
        setPage((prev) => prev + 1);
    };
    const handleTabClick = (newTab) => {
        if (newTab === feedType) {
            setRefreshKey(Date.now());
        } else {
            setFeedType(newTab);
        }
    };
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
    if (loading) {
        return (
            <Box>
                <Stack spacing={4} mt={4}>
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                </Stack>
            </Box>
        );
    }
    if (!user) return <NotFound type="user" />;

    return (
        <>
            <Box
                position="fixed"
                top="0"
                left="0"
                w="full"
                bg={colorMode === "dark" ? "#121212" : "white"}
                zIndex="100"
                borderBottom="1px solid"
                borderColor={colorMode === "dark" ? "whiteAlpha.200" : "gray.300"}
                backdropFilter="blur(10px)"
                py={3}
            >
                <Flex justify="space-between" align="center" px={4} maxW="600px" mx="auto">
                    <IconButton
                        icon={<IoArrowBackOutline />}
                        variant="ghost"
                        size="sm"
                        aria-label="Back"
                        color={colorMode === "dark" ? "white" : "black"}
                        onClick={() => navigate(-1)}
                    />

                    <Box textAlign="center" flex="1" ml="-40px">
                        <Text
                            fontSize="md"
                            fontWeight="bold"
                            color={colorMode === "dark" ? "whiteAlpha.900" : "gray.800"}
                        >
                            Thread
                        </Text>
                        <Text fontSize="xs" color="gray.500">{user.username}</Text>
                    </Box>

                </Flex>
            </Box>

            <UserHeader user={user} onTabChange={handleTabChange} />

            <Box position="sticky" top="0" zIndex={1000} bg="transparent" boxShadow="md" width="100%" p={2}>
                <Tabs
                    tabs={myTabs}
                    onTabChange={handleTabClick}
                    initialTab={feedType}
                    requireAuth={true}
                />
            </Box>

            {posts.length === 0 && !fetchingPosts ? (
                <Flex justifyContent={"center"} alignItems={"center"} h={"200px"}>
                    <Box textAlign={"center"}>
                        <Text fontSize={"xl"} color={"gray.500"}>
                            {feedType === "threads" ? "No posts yet" : "No reposts yet"}
                        </Text>
                    </Box>
                </Flex>
            ) : (
                <>
                    {posts.map((post) => (
                        <Post
                            key={post._id}
                            post={post}
                            postedBy={post.postedBy}
                            onPostUpdate={updatePost}
                            referrer={{
                                url: `/${username}`,
                                page: "user",
                            }}
                        />
                    ))}

                    {fetchingPosts && (
                        <Stack spacing={4} mt={4}>
                            <PostSkeleton />
                            <PostSkeleton />
                        </Stack>
                    )}

                    {!fetchingPosts && hasMore && (
                        <Flex justifyContent="center" mt={4}>
                            <Box
                                as="button"
                                px={4}
                                py={2}
                                borderRadius="md"
                                bg={colorMode === "dark" ? "whiteAlpha.200" : "gray.200"}
                                _hover={{
                                    bg: colorMode === "dark" ? "whiteAlpha.300" : "gray.300",
                                }}
                                onClick={loadMore}
                            >
                                <Text fontWeight="medium">Load more</Text>
                            </Box>
                        </Flex>
                    )}
                </>
            )}
        </>
    );
};

export default UserPage;
