import { Avatar, Box, Flex, Text, IconButton, Divider, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Actions from "./Actions";
import { useEffect, useState, useCallback } from "react";
import useShowToast from "../hooks/useShowToast";
import { formatDistanceToNow } from "date-fns";
import { DeleteIcon } from "@chakra-ui/icons";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import postsAtom from "../atoms/postsAtom";
import { PropTypes } from "prop-types";
import Carousels from "./Carousels";
import { BsRepeat } from "react-icons/bs";

const Post = ({ post, postedBy, onPostUpdate }) => {
    const showToast = useShowToast();
    const currentUser = useRecoilValue(userAtom);
    const [posts, setPosts] = useRecoilState(postsAtom);
    const navigate = useNavigate();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const handleDeletePost = useCallback(async () => {
        try {
            const res = await fetch(`/api/posts/${post?._id}`, {
                method: "DELETE",
            });
            const data = await res.json();

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
            <Box>
                <Flex gap={4} p={4}>
                    <Flex flexDirection={"column"} alignItems={"center"}>
                        <Avatar
                            size="md"
                            name={postedBy?.username || "Unknown"}
                            src={postedBy?.profilePic}
                            onClick={handleNavigateToProfile}
                            cursor="pointer"
                        />
                    </Flex>
                    <Flex flex={1} flexDirection={"column"} gap={2}>
                        <Flex justifyContent={"space-between"} w={"full"}>
                            <Flex w={"full"} alignItems={"center"} gap={2}>
                                <Text
                                    fontSize={"sm"}
                                    fontWeight={"bold"}
                                    onClick={handleNavigateToProfile}
                                    cursor="pointer"
                                >
                                    {postedBy?.username || "Unknown"}
                                </Text>
                                <Text fontSize={"xs"} color={"gray.500"}>
                                    {post.createdAt ? formatDistanceToNow(new Date(post.createdAt)) : "Just now"} ago
                                </Text>
                                {post.repostedBy?.length > 0 && (
                                    <Flex alignItems="center" ml={2}>
                                        <BsRepeat size={12} style={{ marginRight: '4px', color: '#805AD5' }} />
                                        <Text fontSize="xs" color="gray.500">
                                            {post.repostedBy.length} reposts
                                        </Text>
                                    </Flex>
                                )}
                            </Flex>
                            {currentUser?._id === postedBy?._id && (
                                <IconButton
                                    size="sm"
                                    icon={<DeleteIcon />}
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={onOpen}
                                />
                            )}
                        </Flex>
                        <Link to={`/${postedBy.username}/post/${post._id}`}>
                            <Text fontSize={"sm"}>{post.text}</Text>
                        </Link>
                        {/* Hiển thị ảnh/video theo dạng lưới */}
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
                        <Actions post={post} onPostUpdate={onPostUpdate} />
                    </Flex>
                </Flex>
                <Divider />
            </Box>

            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Delete Post</ModalHeader>
                    <ModalBody>
                        Are you sure you want to delete this post? This action cannot be undone.
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="red" onClick={handleDeletePost}>
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
    postedBy: PropTypes.object.isRequired,
    onPostUpdate: PropTypes.func.isRequired,
};
export default Post;
