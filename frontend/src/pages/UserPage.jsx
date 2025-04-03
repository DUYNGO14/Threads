import { useEffect, useState, useCallback } from "react";
import UserHeader from "../components/UserHeader";
import { useParams } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";
import { Flex, Box, Text, Stack, useColorModeValue, GridItem, useColorMode } from "@chakra-ui/react";
import Post from "../components/Post";
import useGetUserProfile from "../hooks/useGetUserProfile";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import PostSkeleton from "../components/PostSkeleton";
import NotFound from "../components/NotFound";
import Tabs from "../components/Tabs";
const UserPage = () => {
    const { user, loading } = useGetUserProfile();
    const { username } = useParams();
    const showToast = useShowToast();
    const [posts, setPosts] = useRecoilState(postsAtom);
    const [fetchingPosts, setFetchingPosts] = useState(true);
    const [feedType, setFeedType] = useState("threads");

    const { colorMode } = useColorMode();
    const myTabs = [
        { value: "threads", label: "Threads" },
        { value: "reposts", label: "Reposts" },
    ];
    const updatePost = useCallback((updatedPost) => {
        if (!updatedPost) {
            setPosts(prev => prev.filter(p => p._id !== updatedPost?._id));
            return;
        }

        // Nếu đang ở tab reposts và post được unrepost, xóa khỏi danh sách
        if (feedType === "reposts" && !updatedPost.repostedBy?.includes(user?._id)) {
            setPosts(prev => prev.filter(p => p._id !== updatedPost._id));
            return;
        }

        setPosts(prev => prev.map(post => post._id === updatedPost._id ? updatedPost : post));
    }, [setPosts, feedType, user?._id]);

    useEffect(() => {
        const getPosts = async () => {
            if (!user) return;
            setFetchingPosts(true);
            try {
                let endpoint;
                if (feedType === "threads") {
                    endpoint = `/api/posts/user/${username}`;
                } else {
                    // Lấy danh sách các bài post đã repost
                    const repostedPosts = [];
                    for (const postId of user.reposts) {
                        const res = await fetch(`/api/posts/${postId}`);
                        const post = await res.json();
                        if (!post.error) {
                            repostedPosts.push(post);
                        }
                    }
                    setPosts(repostedPosts);
                    setFetchingPosts(false);
                    return;
                }

                const res = await fetch(endpoint);
                const data = await res.json();

                if (!Array.isArray(data)) throw new Error("Invalid post data");

                setPosts(data);
            } catch (error) {
                //showToast("Error", error.message, "error");
                setPosts([]);
            } finally {
                setFetchingPosts(false);
            }
        };
        getPosts();
    }, [username, showToast, setPosts, user, feedType]);

    const handleTabChange = (tab) => {
        setPosts([]); // Reset posts khi chuyển tab
        setFeedType(tab);
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
            <GridItem area={'header'}>
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
                        <Text fontSize="md" fontWeight="bold">Profile</Text>
                    </Flex>
                </Box>
                <Box height="60px" /> {/* Thêm khoảng trống tránh nội dung bị che mất */}
            </GridItem>
            <UserHeader user={user} onTabChange={handleTabChange} />
            <Box
                position="sticky"
                top="0"
                zIndex={1000}
                bg={"transparent"}
                boxShadow="md"
                width="100%"
                p={2}
            // Có thể cần thêm padding-top hoặc margin-top nếu có các thành phần khác
            >
                <Tabs tabs={myTabs} onTabChange={setFeedType} initialTab={feedType} requireAuth={true} />
            </Box>
            {fetchingPosts ? (
                <Stack spacing={4} mt={4}>
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                </Stack>
            ) : posts.length === 0 ? (
                <Flex justifyContent={"center"} alignItems={"center"} h={"200px"}>
                    <Box textAlign={"center"}>
                        <Text fontSize={"xl"} color={"gray.500"}>
                            {feedType === "threads" ? "No posts yet" : "No reposts yet"}
                        </Text>
                    </Box>
                </Flex>
            ) : (
                posts.map((post) => (
                    <Post
                        key={post._id}
                        post={post}
                        postedBy={post.postedBy}
                        onPostUpdate={updatePost}
                    />
                ))
            )}
        </>
    );
};

export default UserPage;
