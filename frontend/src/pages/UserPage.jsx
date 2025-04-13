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
} from "@chakra-ui/react";
import Post from "../components/Post";
import useGetUserProfile from "../hooks/useGetUserProfile";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import PostSkeleton from "../components/PostSkeleton";
import NotFound from "../components/NotFound";
import Tabs from "../components/Tabs";

const POST_LIMIT = 2;

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
                    : `/api/posts/reposts?page=${page}&limit=${POST_LIMIT}`;

            const res = await fetch(endpoint);
            const data = await res.json();

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
    }, [fetchPosts]);

    const handleTabChange = (tab) => {
        setFeedType(tab);
        setPage(1);
        setHasMore(true);
        setPosts([]);
    };

    const loadMore = () => {
        setPage((prev) => prev + 1);
    };

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
            <GridItem area={"header"}>
                <Box
                    position="fixed"
                    top="0"
                    left="0"
                    w="full"
                    bg={colorMode === "dark" ? "#101010" : "gray.50"}
                    zIndex="100"
                    borderColor={colorMode === "dark" ? "whiteAlpha.100" : "gray.200"}
                    backdropFilter="blur(12px)"
                    py={2}
                >
                    <Flex justify="center" align="center">
                        <Text fontSize="md" fontWeight="bold">
                            Profile
                        </Text>
                    </Flex>
                </Box>
                <Box height="60px" />
            </GridItem>

            <UserHeader user={user} onTabChange={handleTabChange} />

            <Box position="sticky" top="0" zIndex={1000} bg="transparent" boxShadow="md" width="100%" p={2}>
                <Tabs
                    tabs={myTabs}
                    onTabChange={handleTabChange}
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
