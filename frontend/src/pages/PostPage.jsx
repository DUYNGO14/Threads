import { Avatar, Button, Divider, Flex, Image, Spinner, Text } from "@chakra-ui/react";
import Actions from "../components/Actions";
import { useEffect, useState, useCallback } from "react";
import Comment from "../components/Comment";
import useGetUserProfile from "../hooks/useGetUserProfile";
import useShowToast from "../hooks/useShowToast";
import { useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { DeleteIcon } from "@chakra-ui/icons";
import postsAtom from "../atoms/postsAtom";
import Carousels from "../components/Carousels";

const PostPage = () => {
    const { user, loading } = useGetUserProfile();
    const [posts, setPosts] = useRecoilState(postsAtom);
    const showToast = useShowToast();
    const { pid } = useParams();
    const currentUser = useRecoilValue(userAtom);
    const postId = pid;
    const navigate = useNavigate();
    const currentPost = posts[0];

    const [page, setPage] = useState(1);
    const [totalReplies, setTotalReplies] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const handlePostUpdate = useCallback((updatedPost) => {
        if (!updatedPost) return;
        setPosts([updatedPost]);
    }, [setPosts]);
    const handleReplyUpdate = useCallback((data) => {
        const updatedComment = data.comment; // Lấy thông tin bình luận mới từ dữ liệu trả về

        setPosts(prevPosts => {
            // Cập nhật lại bài viết với bình luận mới
            return prevPosts.map(post => {
                if (post._id === updatedComment.postId) {
                    const updatedReplies = post.replies.map(reply =>
                        reply._id === updatedComment._id
                            ? { ...reply, ...updatedComment } // Thay thế bình luận cũ bằng bình luận mới
                            : reply
                    );

                    return { ...post, replies: updatedReplies }; // Trả về bài viết mới với replies đã được cập nhật
                }
                return post; // Nếu không phải bài viết cần cập nhật, trả về bài viết cũ
            });
        });
    }, [setPosts]);


    const handleDeleteReply = useCallback((replyId) => {
        setPosts(prevPosts =>
            prevPosts.map(post => {
                if (!post.replies) return post;

                const updatedReplies = post.replies.filter(reply => reply._id !== replyId);

                return { ...post, replies: updatedReplies };
            })
        );
    }, [setPosts]);

    // Hàm tải bài viết và bình luận với phân trang
    useEffect(() => {
        const getPost = async () => {
            try {
                const res = await fetch(`/api/posts/${pid}?page=${page}`);
                const data = await res.json();

                if (data.error) {
                    showToast("Error", data.error, "error");
                    return;
                }

                setTotalReplies(data.totalReplies);
                setTotalPages(data.totalPages);

                setPosts(prevPosts => {
                    if (page === 1 || prevPosts.length === 0) {
                        return [{ ...data.post, replies: data.replies }];
                    } else {
                        const existingPost = prevPosts[0];
                        const updatedReplies = [...existingPost.replies, ...data.replies];

                        const uniqueReplies = Array.from(
                            new Map(updatedReplies.map(reply => [reply._id, reply])).values()
                        );

                        return [{ ...existingPost, replies: uniqueReplies }];
                    }
                });

            } catch (error) {
                showToast("Error", error.message, "error");
            }
        };

        getPost();
    }, [showToast, pid, page, setPosts]);


    const handleDeletePost = async () => {
        try {
            if (!window.confirm("Are you sure you want to delete this post?")) return;

            const res = await fetch(`/api/posts/${currentPost._id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.error) {
                showToast("Error", data.error, "error");
                return;
            }
            showToast("Success", "Post deleted", "success");
            navigate(`/${user.username}`);
        } catch (error) {
            showToast("Error", error.message, "error");
        }
    };

    if (!user && loading) {
        return (
            <Flex justifyContent={"center"}>
                <Spinner size={"xl"} />
            </Flex>
        );
    }

    if (!currentPost) return null;

    const handleLoadMoreReplies = () => {
        if (page < totalPages) {
            setPage(prevPage => prevPage + 1);
        }
    };

    return (
        <>
            <Flex mt={5}>
                <Flex w={"full"} alignItems={"center"} gap={3}>
                    <Avatar src={user.profilePic} size={"md"} name={user.username} />
                    <Flex>
                        <Text fontSize={"sm"} fontWeight={"bold"}>
                            {user.username}
                        </Text>
                        <Image src='/verified.png' w='4' h={4} ml={4} />
                    </Flex>
                </Flex>
                <Flex gap={4} alignItems={"center"}>
                    <Text fontSize={"xs"} width={36} textAlign={"right"} color={"gray.light"}>
                        {formatDistanceToNow(new Date(currentPost.createdAt))} ago
                    </Text>

                    {currentUser?._id === user._id && (
                        <DeleteIcon size={20} cursor={"pointer"} onClick={handleDeletePost} />
                    )}
                </Flex>
            </Flex>

            <Text my={3}>{currentPost.text}</Text>

            {currentPost.media?.length > 0 && (
                <Carousels medias={currentPost.media} />
            )}

            <Flex gap={3} my={3}>
                <Actions post={currentPost} onPostUpdate={handlePostUpdate} />
            </Flex>

            <Divider my={4} />
            {currentPost.replies.map((reply) => (
                <Comment
                    key={reply._id}
                    postId={currentPost._id}
                    reply={reply}
                    lastReply={reply._id === currentPost.replies[currentPost.replies.length - 1]._id}
                    currentUser={currentUser}
                    onReplyUpdate={handleReplyUpdate}
                    onReplyDelete={handleDeleteReply}
                />
            ))}

            {/* Hiển thị nút "Xem thêm bình luận" */}
            {page < totalPages && (
                <Button onClick={handleLoadMoreReplies} mt={4}>
                    Xem thêm bình luận
                </Button>
            )}
        </>
    );
};

export default PostPage;
