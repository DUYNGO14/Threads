import { Avatar, Box, Flex, Text, IconButton, Divider, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, useColorModeValue } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Actions from "./Actions";
import React, { useCallback, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { formatDistanceToNow } from "date-fns";
import { DeleteIcon } from "@chakra-ui/icons";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import postsAtom from "../atoms/postsAtom";
import { PropTypes } from "prop-types";
import Carousels from "./Carousels";
import api from "../services/api.js";
const Post = ({ post, postedBy, onPostUpdate, referrer }) => {
    const showToast = useShowToast();
    const currentUser = useRecoilValue(userAtom);
    const [posts, setPosts] = useRecoilState(postsAtom);
    const navigate = useNavigate();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isDeleting, setIsDeleting] = useState(false);
    const emptyBg = useColorModeValue('white', 'gray.dark');
    const handleDeletePost = useCallback(async () => {
        try {
            setIsDeleting(true);
            const res = await api.delete(`/api/posts/${post?._id}`);
            const data = res.data;

            if (data.error) {
                showToast("Error", data.error, "error");
                return;
            }

            showToast("Success", data.message, "success");

            setPosts(posts.filter((p) => p._id !== data.post._id));

            if (onPostUpdate) {
                onPostUpdate(null);
            }
            onClose();
        } catch (error) {
            showToast("Error", error.message, "error");
        } finally {
            setIsDeleting(false);
        }
    }, [post?._id, showToast, onPostUpdate, posts, setPosts, onClose]);

    const handleNavigateToProfile = useCallback((e) => {
        e.preventDefault();
        if (postedBy?.username) {
            navigate(`/${postedBy.username}`);
        }
    }, [navigate, postedBy?.username]);

    if (!post || !postedBy) return null;

    return (
        <>
            <Box
                w="full"
                id={`post-${post._id}`}
                bg={emptyBg}
                borderRadius="md"
                boxShadow="sm"
                mb={6}
                p={4}
            >
                {/* Reposted by section */}
                {post.repostedBy?.length > 0 && (
                    <Flex
                        fontSize="xs"
                        color="gray.500"
                        mb={3}
                        wrap="wrap"
                        align="center"
                    >
                        <Text mr={1} fontWeight="medium" color="gray.600">
                            Reposted by:
                        </Text>
                        {post.repostedBy.map((user, index) => (
                            <React.Fragment key={user._id}>
                                <Text
                                    as={Link}
                                    to={`/${user.username}`}
                                    color="blue.500"
                                    _hover={{ textDecoration: "underline" }}
                                    mr={1}
                                >
                                    {user.username}
                                </Text>
                                {index < post.repostedBy.length - 1 && <Text mr={1}>,</Text>}
                            </React.Fragment>
                        ))}
                    </Flex>
                )}

                {/* Post content */}
                <Flex gap={4}>
                    <Flex flexDirection="column" alignItems="center">
                        <Avatar
                            size="md"
                            name={postedBy?.username}
                            src={postedBy?.profilePic}
                            onClick={handleNavigateToProfile}
                            cursor="pointer"
                        />
                    </Flex>
                    <Flex flex={1} flexDirection="column" gap={2}>
                        {/* Header */}
                        <Flex justify="space-between" w="full" align="center">
                            <Flex align="center" gap={2}>
                                <Text
                                    fontSize="sm"
                                    fontWeight="bold"
                                    onClick={handleNavigateToProfile}
                                    cursor="pointer"
                                    _hover={{ textDecoration: "underline" }}
                                >
                                    {postedBy?.username || "Unknown"}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                    {post.createdAt
                                        ? formatDistanceToNow(new Date(post.createdAt))
                                        : "Just now"}
                                </Text>
                            </Flex>
                            {currentUser?._id === postedBy?._id && (
                                <IconButton
                                    size="sm"
                                    icon={<DeleteIcon />}
                                    colorScheme="red"
                                    variant="ghost"
                                    aria-label="Delete Post"
                                    onClick={onOpen}
                                />
                            )}
                        </Flex>

                        {/* Text */}
                        <Link
                            to={`/${postedBy.username}/post/${post._id}`}
                            onClick={() => {
                                localStorage.setItem("scrollToPostId", post._id);
                                localStorage.setItem("referrer", JSON.stringify(referrer));
                            }}
                        >
                            <Text fontSize="sm" whiteSpace="pre-line" mt={1}>
                                {post.text}
                            </Text>
                        </Link>

                        {/* Media */}
                        {post.media?.length > 0 && (
                            <Box
                                mt={2}
                                borderRadius="md"
                                overflow="hidden"
                                width="100%"
                                maxW="600px"
                            >
                                <Carousels medias={post.media} />
                            </Box>
                        )}

                        {/* Actions (like, comment, etc.) */}
                        <Actions post={post} onPostUpdate={onPostUpdate} />
                    </Flex>
                </Flex>
                <Divider mt={4} />
            </Box>

            {/* Delete Modal */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="lg" fontWeight="bold">
                        Delete Post
                    </ModalHeader>
                    <ModalBody>
                        Are you sure you want to delete this post? This action cannot be undone.
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="red"
                            onClick={handleDeletePost}
                            isLoading={isDeleting}
                        >
                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>

    );
};

Post.propTypes = {
    post: PropTypes.object.isRequired,
    postedBy: PropTypes.object,
    onPostUpdate: PropTypes.func.isRequired,
    referrer: PropTypes.object,
};
export default Post;
