import {
    Box,
    Button,
    Flex,
    FormControl,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    useDisclosure,
    IconButton,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "@hooks/useShowToast";
import { PropTypes } from "prop-types";
import { BsHeart, BsHeartFill, BsChat, BsShare, BsRepeat } from "react-icons/bs";
import { FaRepeat } from "react-icons/fa6";
import api from "../services/api.js";

const Actions = ({ post, onPostUpdate, totalReply, setTotalReply }) => {
    const user = useRecoilValue(userAtom);
    const [liked, setLiked] = useState(post?.likes?.includes(user?._id) || false);
    const [reposted, setReposted] = useState(post?.repostedBy?.includes(user?._id) || false);
    const [isLiking, setIsLiking] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [isReposting, setIsReposting] = useState(false);
    const [reply, setReply] = useState("");
    const showToast = useShowToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        if (post && user) {
            setLiked(post.likes?.includes(user._id) || false);
            setReposted(post.repostedBy?.includes(user._id) || false);
        }
    }, [post, user]);

    if (!post) return null;

    const handleLikeAndUnlike = async () => {
        if (!user) {
            showToast("", "You must be logged in to like posts", "warning");
            return;
        }
        if (isLiking) return;
        setIsLiking(true);
        // ✅ Cập nhật UI ngay
        const wasLiked = liked;
        setLiked(!wasLiked);
        const updatedLikes = wasLiked
            ? post.likes.filter(id => id !== user._id)
            : [...(post.likes || []), user._id];
        onPostUpdate({ ...post, likes: updatedLikes });

        try {
            const { data } = await api.put(`/api/posts/like/${post._id}`);
            if (data.error) throw new Error(data.error);
        } catch (error) {
            setLiked(wasLiked);
            const rollbackLikes = wasLiked
                ? [...(post.likes || []), user._id]
                : post.likes.filter(id => id !== user._id);
            onPostUpdate({ ...post, likes: rollbackLikes });

            const message = error.response?.data?.message || error.message;
            showToast("Error", message || "Failed to like post", "error");
        } finally {
            setIsLiking(false);
        }
    };


    const handleReply = () => {
        if (!user) {
            showToast("", "You must be logged in to reply", "warning");
            return;
        }
        onOpen();
    };

    const handleSubmitReply = async () => {
        if (!reply.trim()) {
            showToast("Error", "Reply cannot be empty", "error");
            return;
        }

        setIsReplying(true);
        try {
            const res = await api.put(`/api/posts/reply/${post._id}`, { text: reply });
            const newReply = res.data.reply;
            const updatedPost = {
                ...post,
                replies: [
                    ...post.replies,
                    newReply,
                ],
            };

            if (totalReply) {
                setTotalReply(totalReply + 1);
            }

            onPostUpdate(updatedPost);
            setReply("");
            onClose();
            showToast("Success", "Reply added successfully", "success");
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            showToast("Error", message || "Failed to reply", "error");
        } finally {
            setIsReplying(false);
        }
    };

    const copyURL = () => {
        if (!post.postedBy || !post.postedBy.username) {
            showToast("Error", "Unable to copy link", "error");
            return;
        }

        const postURL = `${window.location.origin}/${post.postedBy.username}/post/${post._id}`;
        navigator.clipboard.writeText(postURL)
            .then(() => showToast("Success", "Copy link successfully", "success"))
            .catch(() => showToast("Error", "Unable to copy link", "error"));
    };

    const handleRepost = async () => {
        if (!user) {
            showToast("", "You must be logged in to repost", "warning");
            return;
        }

        // 1. Optimistic update
        const newReposted = !reposted;
        setReposted(newReposted);

        const updatedPost = {
            ...post,
            repostedBy: newReposted
                ? [...(post.repostedBy || []), user._id]
                : post.repostedBy.filter(id => id !== user._id),
        };

        onPostUpdate(updatedPost);

        try {
            if (isReposting) return;
            setIsReposting(true);
            // 2. Call API
            const { data } = await api.put(`/api/posts/repost/${post._id}`);
            if (data.error) throw new Error(data.error);

            showToast("Success", newReposted ? "Post reposted" : "Post unreposted", "success");
        } catch (error) {
            // 3. Rollback UI nếu lỗi
            const rolledBackPost = {
                ...post,
                repostedBy: reposted
                    ? [...(post.repostedBy || []), user._id]
                    : post.repostedBy.filter(id => id !== user._id),
            };

            onPostUpdate(rolledBackPost);
            setReposted(reposted); // quay lại trạng thái cũ

            const message = error.response?.data?.message || error.message;
            showToast("Error", message || "Failed to repost", "error");
        } finally {
            setIsReposting(false);
        }
    };


    return (
        <Flex flexDirection='column'>
            <Flex gap={3} my={2} onClick={(e) => e.preventDefault()}>
                <Flex alignItems="center" gap={1}>
                    <IconButton
                        size={"md"}
                        icon={liked ? <BsHeartFill style={{ color: '#E53E3E' }} /> : <BsHeart />}
                        colorScheme="red"
                        variant={"ghost"}
                        onClick={handleLikeAndUnlike}
                        isDisabled={isLiking}
                    />

                    <Text fontSize="sm" color={liked ? "red.500" : "gray.light"}>
                        {post?.likes?.length || 0}
                    </Text>
                </Flex>

                <Flex alignItems="center" gap={1}>
                    <IconButton
                        size={"md"}
                        icon={<BsChat />}
                        colorScheme="blue"
                        variant={"ghost"}
                        onClick={handleReply}
                        isLoading={isReplying}
                    />
                    <Text fontSize="sm" color="gray.light">
                        {post?.replies?.length || totalReply || 0}
                    </Text>
                </Flex>

                <Flex alignItems="center" gap={1}>
                    <IconButton
                        size={"md"}
                        icon={<BsShare />}
                        colorScheme="green"
                        variant={"ghost"}
                        onClick={copyURL}
                    />
                </Flex>

                {user?._id !== post?.postedBy?._id && (
                    <Flex alignItems="center" gap={1}>
                        <IconButton
                            size={"md"}
                            icon={reposted ? <FaRepeat style={{ color: '#805AD5' }} /> : <BsRepeat />}
                            colorScheme="purple"
                            variant={"ghost"}
                            onClick={handleRepost}
                            isDisabled={isReposting}
                        />
                        <Text fontSize="sm" color={reposted ? "purple.500" : "gray.light"}>
                            {post?.repostedBy?.length || 0}
                        </Text>
                    </Flex>
                )}
            </Flex>

            {isOpen && <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader></ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <FormControl>
                            <Input
                                placeholder='Reply goes here..'
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                            />
                        </FormControl>
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme='blue' size={"sm"} mr={3} isLoading={isReplying} onClick={handleSubmitReply}>
                            Reply
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>}
        </Flex>
    );
};

Actions.propTypes = {
    post: PropTypes.object,
    onPostUpdate: PropTypes.func.isRequired,
}

export default Actions;

