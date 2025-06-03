import {
    Avatar,
    Box,
    Button,
    Divider,
    Flex,
    IconButton,
    Image,
    Spinner,
    Text,
    useColorMode
} from "@chakra-ui/react";
import Actions from "@components/Actions";
import { useEffect, useState, useCallback } from "react";
import { IoArrowBackOutline } from "react-icons/io5";
import Comment from "@components/Comment";
import useGetUserProfile from "@hooks/useGetUserProfile";
import useShowToast from "@hooks/useShowToast";
import { useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import userAtom from "../atoms/userAtom";
import { DeleteIcon } from "@chakra-ui/icons";
import Carousels from "@components/Carousels";
import api from "../services/api.js";
import { renderMentionText } from "../components/renderMentionText.jsx";
import { useRecoilValue } from "recoil";

const PostPage = () => {
    const { user } = useGetUserProfile();
    const showToast = useShowToast();
    const { pid } = useParams();
    const currentUser = useRecoilValue(userAtom);
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [replies, setReplies] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalReply, setTotalReply] = useState(0);
    const [isPostLoading, setIsPostLoading] = useState(true);
    const { colorMode } = useColorMode();

    const fetchPost = useCallback(async () => {
        setIsPostLoading(true);
        try {
            const res = await api.get(`/api/posts/${pid}?page=${page}&limit=5`);
            const { post, replies: newReplies, totalPages, totalReplies } = res.data;
            console.log(res.data);
            setPost(post);
            setTotalPages(totalPages);
            setTotalReply(totalReplies);
            setReplies(prev => {
                if (page === 1) return newReplies;

                const replyMap = new Map([...prev, ...newReplies].map(r => [r._id, r]));
                return Array.from(replyMap.values());
            });
        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            // showToast("Error", msg, "error");
        } finally {
            setIsPostLoading(false);
        }
    }, [pid, page, showToast]);


    useEffect(() => {
        fetchPost();
    }, [fetchPost]);


    const handleBack = useCallback(() => {
        const referrerData = sessionStorage.getItem("referrer");
        const scrollToPostId = sessionStorage.getItem("scrollToPostId");

        if (referrerData) {
            const referrer = JSON.parse(referrerData);
            navigate(referrer.url, {
                state: { fromPostPage: true, postId: scrollToPostId },
            });

            setTimeout(() => {
                sessionStorage.removeItem("referrer");
                sessionStorage.removeItem("scrollToPostId");
            }, 100);
        } else {
            navigate(-1);
        }
    }, [navigate]);

    const handleDeletePost = async () => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        try {
            const res = await api.delete(`/api/posts/${post._id}`);
            if (res.data?.error) {
                showToast("Error", res.data.error, "error");
                return;
            }
            showToast("Success", "Post deleted", "success");
            navigate(`/${user.username}`);
        } catch (err) {
            showToast("Error", err.message, "error");
        }
    };

    const handleReplyUpdate = updatedReply => {
        setReplies(prev =>
            prev.map(reply =>
                reply._id === updatedReply._id ? { ...reply, ...updatedReply } : reply
            )
        );
    };

    const handleDeleteReply = replyId => {
        setReplies(prev => prev.filter(reply => reply._id !== replyId));
    };

    const handleLoadMoreReplies = () => {
        if (page < totalPages) {
            setPage(prev => prev + 1);
        }
    };

    if (isPostLoading) {
        return (
            <Flex justifyContent="center" mt={10}>
                <Spinner size="xl" />
            </Flex>
        );
    }

    return (
        <>
            {/* Header */}
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
                <Flex justify="space-between" align="center" px={4} maxWidth="700px" mx="auto">
                    <IconButton
                        icon={<IoArrowBackOutline />}
                        variant="ghost"
                        size="sm"
                        aria-label="Back"
                        color={colorMode === "dark" ? "whiteAlpha.900" : "gray.800"}
                        _hover={{ bg: colorMode === "dark" ? "whiteAlpha.200" : "gray.100" }}
                        fontWeight="bold"
                        fontSize="20px"
                        onClick={handleBack}
                    />

                    <Box textAlign="center" flex="1" ml="-40px">
                        <Text fontSize="md" fontWeight="bold" color={colorMode === "dark" ? "whiteAlpha.900" : "gray.800"}>
                            Thread
                        </Text>
                        <Text fontSize="xs" color="gray.500">{post.postedBy?.username}</Text>
                    </Box>
                </Flex>
            </Box>

            <Box height="65px" />
            {post ? (<>
                <Flex mt={5}>
                    <Flex w="full" alignItems="center" gap={3} onClick={() => navigate(`/user/${post.postedBy.username}`)} cursor="pointer">
                        <Avatar src={post.postedBy.profilePic} size="md" name={post.postedBy.username} />
                        <Flex>
                            <Text fontSize="sm" fontWeight="bold">
                                {post.postedBy.username}
                            </Text>
                        </Flex>
                    </Flex>
                    <Flex gap={4} alignItems="center">
                        <Text fontSize="xs" width={36} textAlign="right" color="gray.light">
                            {formatDistanceToNow(new Date(post.createdAt))} ago
                        </Text>
                        {currentUser?._id === post.postedBy._id && (
                            <DeleteIcon size={20} cursor="pointer" onClick={handleDeletePost} color="red.300" _hover={{ color: "red.500" }} />
                        )}
                    </Flex>
                </Flex>

                <Text whiteSpace="pre-line" my={3}>
                    {renderMentionText(post.text)}
                </Text>

                {post.media?.length > 0 && (
                    <Carousels medias={post.media} />
                )}

                <Flex gap={3} my={3}>
                    <Actions post={post} onPostUpdate={setReplies} totalReply={totalReply} setTotalReply={setTotalReply} />
                </Flex>

                <Divider my={4} />
                {replies.map(reply => (
                    <Comment
                        key={reply._id}
                        postId={post._id}
                        reply={reply}
                        lastReply={reply._id === replies[replies.length - 1]._id}
                        currentUser={currentUser}
                        onReplyUpdate={handleReplyUpdate}
                        onReplyDelete={handleDeleteReply}
                    />
                ))}

                {page < totalPages && (
                    <Button onClick={handleLoadMoreReplies} mt={4}>
                        Show more replies
                    </Button>
                )}
            </>) : (
                <Box textAlign="center" mt={10}>
                    <Image
                        src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png" // ví dụ ảnh minh họa
                        alt="No post found"
                        mx="auto"
                        boxSize="150px"
                        mb={6}
                    />
                    <Text fontSize="lg" fontWeight="semibold" color="gray.500" mb={4}>
                        The post does not exist or has been deleted.
                    </Text>
                    <Button colorScheme="teal" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </Box>
            )}

        </>
    );
};

export default PostPage;
