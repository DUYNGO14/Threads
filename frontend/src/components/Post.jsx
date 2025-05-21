import {
    Avatar, Box, Flex, Text, IconButton, Divider, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Menu, MenuButton, MenuList, MenuItem,
    useColorModeValue
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { CgMoreO } from "react-icons/cg";
import { formatDistanceToNow } from "date-fns";
import React, { useState, useCallback, useEffect } from "react";
import { MdNavigateNext } from "react-icons/md";
import PropTypes from "prop-types";
import useShowToast from "@hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import postsAtom from "../atoms/postsAtom";
import api from "../services/api.js";
import Carousels from "./Carousels";
import Actions from "./Actions";
import ReportDialog from "./ReportDialog";
import UpdatePostModal from "./UpdatePostModal";
import CountdownUpdatePost from "./CountdownUpdatePost";
import { renderMentionText } from "./renderMentionText.jsx";

const Post = ({ post, postedBy, onPostUpdate, type, referrer, }) => {
    const showToast = useShowToast();
    const currentUser = useRecoilValue(userAtom);
    const navigate = useNavigate();
    const { isOpen: isDeleteOpen, onOpen, onClose } = useDisclosure();
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [posts, setPosts] = useRecoilState(postsAtom);
    const [isUpdatePostOpen, setIsUpdatePostOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const expireTime = new Date(post.createdAt).getTime() + 10 * 60 * 1000;
        const interval = setInterval(() => {
            const remaining = expireTime - Date.now();
            setTimeLeft(Math.max(remaining, 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [post.createdAt]);

    const handleDeletePost = useCallback(async () => {
        setIsDeleting(true);
        try {
            const { data } = await api.delete(`/api/posts/${post._id}`);
            if (data.error) {
                showToast("Error", data.error, "error");
            } else {
                setPosts((prev) => prev.filter((p) => p._id !== post._id));
                showToast("Success", data.message, "success");
                onClose();
            }
        } catch (err) {
            showToast("Error", err.response?.data?.error || "Something went wrong.", "error");
        } finally {
            setIsDeleting(false);
        }
    }, [post._id, showToast, setPosts, onClose]);

    const navigateToProfile = (e) => {
        e.preventDefault();
        if (postedBy?.username !== currentUser?.username) {
            navigate(`/user/${postedBy.username}`);
        }
    };

    const handleNavidatePostPage = (e) => {
        e.preventDefault();
        sessionStorage.setItem("referrer", JSON.stringify(referrer));
        sessionStorage.setItem("scrollToPostId", post._id);
        navigate(`/${postedBy.username}/post/${post._id}`);
    };


    const openUpdateModal = () => setIsUpdatePostOpen(true);
    const closeUpdateModal = () => setIsUpdatePostOpen(false);

    if (!post || !postedBy) return null;

    return (
        <>
            <Box w="full" id={`post-${post._id}`} borderRadius="md" boxShadow="sm" mb={1} p={2}>
                {type === "followed" && post.repostedBy?.length > 0 && (
                    <Flex fontSize="xs" color="gray.500" wrap="wrap" align="center" mb={2}>
                        <Text mr={1} fontWeight="medium">Reposted by:</Text>
                        {post.repostedBy.map((user, index) => (
                            <React.Fragment key={index}>
                                <Link to={`/user/${user.username}`} style={{ color: 'blue' }}>
                                    <Text as="span" _hover={{ textDecoration: "underline" }}>
                                        {user.username}
                                    </Text>
                                </Link>
                                {index < post.repostedBy.length - 1 && <Text mx={1}>,</Text>}
                            </React.Fragment>
                        ))}
                    </Flex>
                )}

                <Flex gap={4}>
                    <Avatar
                        size="md"
                        name={postedBy.username}
                        src={postedBy.profilePic}
                        onClick={navigateToProfile}
                        cursor="pointer"
                    />
                    <Flex flex={1} flexDirection="column" gap={2}>
                        <Flex justify="space-between" align="center">
                            <Flex align="center" gap={2}>
                                <Text
                                    fontSize="sm"
                                    fontWeight="bold"
                                    cursor="pointer"
                                    onClick={navigateToProfile}
                                    _hover={{ textDecoration: "underline" }}
                                >
                                    {postedBy.username}
                                </Text>
                                {post.tags?.length > 0 && (
                                    <>
                                        <IconButton size="xs" icon={<MdNavigateNext />} />
                                        <Text fontSize="sm" fontWeight="hairline">{post.tags}</Text>
                                    </>
                                )}
                                <Text fontSize="xs" color="gray.500">
                                    {formatDistanceToNow(new Date(post.createdAt))}
                                </Text>
                            </Flex>

                            <Menu>
                                <MenuButton
                                    as={IconButton}
                                    size="sm"
                                    icon={<CgMoreO />}
                                    variant="ghost"
                                    aria-label="Post Options"
                                />
                                <MenuList>
                                    {currentUser?._id === postedBy._id ? (
                                        <>
                                            <MenuItem onClick={onOpen}>Delete Post</MenuItem>
                                            {timeLeft > 0 && (
                                                <CountdownUpdatePost
                                                    post={post}
                                                    handleOpenUpdatePost={openUpdateModal}
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <MenuItem onClick={() => setIsReportOpen(true)}>Report Post</MenuItem>
                                    )}
                                </MenuList>
                            </Menu>
                        </Flex>


                        <Box fontSize="sm" whiteSpace="pre-wrap" wordBreak="break-word" onClick={handleNavidatePostPage} cursor={"pointer"}>
                            {renderMentionText(post.text)}
                        </Box>

                        {post.media?.length > 0 && (
                            <Box mt={1} borderRadius="md" overflow="hidden" maxW="600px" >
                                <Carousels medias={post.media} />
                            </Box>
                        )}

                        <Actions post={post} onPostUpdate={onPostUpdate} />
                    </Flex>
                </Flex>
                <Divider mt={4} />
            </Box>

            <Modal isOpen={isDeleteOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent bg={useColorModeValue('gray.100', 'gray.dark')}>
                    <ModalHeader fontSize="xl" fontWeight="bold" textAlign="center">Delete Post</ModalHeader>
                    <Divider maxWidth={"90%"} mx={"auto"} />
                    <ModalBody>Are you sure you want to delete this post? This action cannot be undone.</ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                        <Button colorScheme="red" onClick={handleDeletePost} isLoading={isDeleting}>
                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {isReportOpen && (
                <ReportDialog
                    type="post"
                    isOpen={isReportOpen}
                    onClose={() => setIsReportOpen(false)}
                    post={post}
                    postedBy={postedBy}
                />
            )}

            {isUpdatePostOpen && (
                <UpdatePostModal
                    isOpen={isUpdatePostOpen}
                    onClose={closeUpdateModal}
                    post={post}
                />
            )}
        </>
    );
};

Post.propTypes = {
    post: PropTypes.object.isRequired,
    postedBy: PropTypes.object.isRequired,
    onPostUpdate: PropTypes.func.isRequired,
};

export default Post;
