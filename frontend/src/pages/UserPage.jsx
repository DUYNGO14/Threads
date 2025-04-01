import { useEffect, useState, useCallback } from "react";
import UserHeader from "../components/UserHeader";
import { useParams } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";
import { Flex, Box, Text, Stack } from "@chakra-ui/react";
import Post from "../components/Post";
import useGetUserProfile from "../hooks/useGetUserProfile";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import PostSkeleton from "../components/PostSkeleton";

const UserPage = () => {
    const { user, loading } = useGetUserProfile();
    const { username } = useParams();
    const showToast = useShowToast();
    const [posts, setPosts] = useRecoilState(postsAtom);
    const [fetchingPosts, setFetchingPosts] = useState(true);
    const [feedType, setFeedType] = useState("threads");

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
                showToast("Error", error.message, "error");
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

    if (!user) return <h1>User not found</h1>;

    return (
        <>
            <UserHeader user={user} onTabChange={handleTabChange} />

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
