import { useEffect, useState, useCallback } from "react";
import { Spinner, Box, Flex } from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useSetRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import SuggestedUsers from "../components/SuggestedUsers";
import Post from "../components/Post";
import Tabs from "../components/Tabs"; // 🔥 Import Tabs
import { debounce } from "lodash";

const HomePage = () => {
    const [posts, setPosts] = useRecoilState(postsAtom);
    const resetPosts = useSetRecoilState(postsAtom);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [feedType, setFeedType] = useState("propose");
    const showToast = useShowToast();

    // 🟢 Fetch API theo tab được chọn
    const getFeedPost = async (pageNumber) => {
        if (loading || !hasMore) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/posts/${feedType}?page=${pageNumber}&limit=5`);
            const data = await res.json();

            if (data.error) {
                showToast("Error", data.error, "error");
                return;
            }

            // 🛑 Lọc bài viết trùng ID
            setPosts((prev) => {
                const uniquePosts = [...prev, ...data.posts].reduce((acc, post) => {
                    if (!acc.some((p) => p._id === post._id)) acc.push(post);
                    return acc;
                }, []);
                return uniquePosts;
            });

            setHasMore(data.posts.length > 0);
        } catch (error) {
            showToast("Error", error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // 🟢 Reset khi đổi tab
    useEffect(() => {
        resetPosts([]);
        setPage(1);
        setHasMore(true);
        getFeedPost(1);
    }, [feedType]);

    // 🟢 Xử lý cuộn trang có debounce
    const handleScroll = useCallback(
        debounce(() => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
                setPage((prevPage) => {
                    if (!loading && hasMore) {
                        return prevPage + 1;
                    }
                    return prevPage;
                });
            }
        }, 300),
        [loading, hasMore]
    );

    // 🟢 Lắng nghe sự kiện cuộn
    useEffect(() => {
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    // 🟢 Gọi API khi `page` thay đổi
    useEffect(() => {
        if (page > 1) getFeedPost(page);
    }, [page]);

    return (
        <Flex gap={10} alignItems={"flex-start"}>
            <Box flex={70}>
                {/* 🟢 Thay vì nút, dùng Tabs */}
                <Tabs onTabChange={setFeedType} />

                {!loading && posts.length === 0 && <h1>Không có bài viết nào</h1>}

                {posts.map((post) => (
                    <Post key={post._id} post={post} postedBy={post.postedBy} />
                ))}

                {loading && posts.length > 0 && (
                    <Flex justifyContent={"center"} mt={4}>
                        <Spinner size={"xl"} />
                    </Flex>
                )}

                {!hasMore && posts.length > 0 && (
                    <Flex justifyContent={"center"} mb={4} color="gray.500">
                        <p>📌 Đã hết bài viết</p>
                    </Flex>
                )}
            </Box>
            <Box flex={30} display={{ base: "none", md: "block" }}>
                <SuggestedUsers />
            </Box>
        </Flex>
    );
};

export default HomePage;
