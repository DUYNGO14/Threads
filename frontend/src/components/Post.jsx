import {
    Avatar, Box, Flex, Text, IconButton, Divider, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, useColorModeValue,
    Menu, MenuButton, MenuList, MenuItem,
    Icon
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { CgMoreO } from "react-icons/cg";
import { formatDistanceToNow } from "date-fns";
import React, { useState, useCallback } from "react";
import useShowToast from "@hooks/useShowToast";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import api from "../services/api.js";
import PropTypes from "prop-types";
import Carousels from "./Carousels";
import Actions from "./Actions";
import useReport from "@hooks/useReport.js";
import ReportDialog from "./ReportDialog";
import { MdNavigateNext } from "react-icons/md";
const Post = ({ post, postedBy, onPostUpdate }) => {
    const showToast = useShowToast();
    const currentUser = useRecoilValue(userAtom);
    const navigate = useNavigate();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const { error, createReport } = useReport();

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
            onPostUpdate(null);
            onClose();
        } catch (error) {
            showToast("Error", error.message, "error");
        } finally {
            setIsDeleting(false);
        }
    }, [post?._id, showToast, onPostUpdate, onClose]);

    const handleNavigateToProfile = useCallback((e) => {
        e.preventDefault();
        if (postedBy?.username && postedBy?.username !== currentUser?.username) {
            navigate(`/user/${postedBy.username}`);
        }
    }, [navigate, postedBy?.username, currentUser?.username]);

    const submitReport = async (reasonToSubmit) => {
        if (!reasonToSubmit) {
            showToast("Error", "Please select a reason.", "error");
            return;
        }

        try {
            const result = await createReport({
                reportedBy: currentUser._id,
                postId: post._id,
                reason: reasonToSubmit,
                type: "post",
                userId: postedBy._id
            });

            // Kiểm tra nếu có lỗi
            if (!result) {
                showToast("Error", "Something went wrong.", "error");
                return;
            }

            showToast("Success", "Report submitted successfully.", "success");
            setIsReportOpen(false);
        } catch (error) {
            showToast("Error", error.message, "error");
        }
    };


    if (!post || !postedBy) return null;

    return (
        <>
            <Box w="full" id={`post-${post._id}`} borderRadius="md" boxShadow="sm" mb={2} p={4}>
                {/* Reposted by section */}
                {post.repostedBy?.length > 0 && post.repostedBy[0]?.username && (
                    <Flex fontSize="xs" color="gray.500" wrap="wrap" align="center">
                        <Text mr={1} fontWeight="medium" color="gray.600">
                            Reposted by:
                        </Text>
                        {post.repostedBy.map((user, index) => (
                            <React.Fragment key={user._id}>
                                <Text
                                    as={Link}
                                    to={`/user/${user.username}`}
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

                                {post.tags && post.tags.length > 0 && (
                                    <>
                                        <IconButton size="xs" icon={<MdNavigateNext />} />
                                        <Text fontSize="sm" fontWeight="hairline">
                                            {post.tags}
                                        </Text>
                                    </>
                                )}
                                <Text fontSize="xs" color="gray.500">
                                    {post.createdAt ? formatDistanceToNow(new Date(post.createdAt)) : "Just now"}
                                </Text>
                            </Flex>
                            {currentUser?._id === postedBy?._id ? (
                                <Menu>
                                    <MenuButton as={IconButton} size="lg" icon={<CgMoreO />} colorScheme="blue" variant="ghost" aria-label="Post Actions" />
                                    <MenuList>
                                        <MenuItem onClick={onOpen}>Delete Post</MenuItem>
                                        <MenuItem onClick={() => { }}>Update Post</MenuItem>
                                    </MenuList>
                                </Menu>
                            ) : (
                                <Menu>
                                    <MenuButton as={IconButton} size="sm" icon={<CgMoreO />} colorScheme="blue" variant="ghost" aria-label="Report Post" />
                                    <MenuList>
                                        <MenuItem onClick={() => setIsReportOpen(true)}>Report Post</MenuItem>
                                    </MenuList>
                                </Menu>
                            )}
                        </Flex>

                        <Link to={`/${postedBy.username}/post/${post._id}`}>
                            <Text fontSize="sm" whiteSpace="pre-line" mt={1}>
                                {post.text}
                            </Text>
                        </Link>

                        {post.media?.length > 0 && (
                            <Box mt={2} borderRadius="md" overflow="hidden" width="100%" maxW="600px">
                                <Carousels medias={post.media} />
                            </Box>
                        )}

                        <Actions post={post} onPostUpdate={onPostUpdate} />
                    </Flex>
                </Flex>
                <Divider mt={4} />
            </Box>

            {/* Delete Modal */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="lg" fontWeight="bold">Delete Post</ModalHeader>
                    <ModalBody>Are you sure you want to delete this post? This action cannot be undone.</ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                        <Button colorScheme="red" onClick={handleDeletePost} isLoading={isDeleting}>Delete</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Report Dialog */}
            <ReportDialog
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                onSubmit={submitReport}
            />
        </>
    );
};

Post.propTypes = {
    post: PropTypes.object.isRequired,
    postedBy: PropTypes.object,
    onPostUpdate: PropTypes.func.isRequired,
};

export default Post;
