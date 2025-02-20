import { Spinner, Text, Box, Flex } from "@chakra-ui/react"
import useShowToast from "../hooks/useShowToast";
import { useEffect, useState } from "react"
import Post from "../components/Post";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import SuggestedUsers from "../components/SuggestedUsers";

const HomePage = () => {
    const [posts, setPosts] = useRecoilState(postsAtom);
    const [loading, setLoading] = useState(true);
    const showToast = useShowToast();

    useEffect(() => {
        const getFeedPost = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/posts/feed");
                const data = await res.json();
                if (data.error) {
                    return showToast("Error", data.error, "error");
                }
                setPosts(data);
            } catch (error) {
                showToast("Error", error, "error");
            } finally {
                setLoading(false);
            }
        }
        getFeedPost();
    }, [showToast, setPosts]);
    return (
        <Flex gap={10} alignItems={"flex-start"}>
            <Box flex={70}>
                <Flex w={"full"} mb={4}>
                    <Flex flex={1} borderBottom={"1.5px solid white"} justifyContent={"center"} pb={3} cursor={"pointer"}>
                        <Text fontWeight={"bold"}>Followed</Text>
                    </Flex>
                    <Flex flex={1} borderBottom={"1px solid gray"} justifyContent={"center"} pb={3} color={"gray.light"} cursor={"pointer"}>
                        <Text fontWeight={"bold"}>Propose</Text>
                    </Flex>
                </Flex>
                {!loading && posts.length === 0 && <h1>Follow some user to see their posts</h1>}
                {loading && (
                    <Flex justifyContent={"center"}>
                        <Spinner size={"xl"} />
                    </Flex>
                )}

                {posts.map((post) => (
                    <Post key={post._id} post={post} postedBy={post.postedBy} />
                ))}
            </Box>
            <Box
                flex={30}
                display={{
                    base: "none",
                    md: "block",
                }}
            >
                <SuggestedUsers />
            </Box>
        </Flex>
    )
}

export default HomePage