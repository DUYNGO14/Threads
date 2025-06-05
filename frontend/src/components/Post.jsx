import {
    Avatar, Box, Flex, Text, IconButton, Divider, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Menu, MenuButton, MenuList, MenuItem,
    useColorModeValue, Stack, AvatarBadge, Tooltip
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { CgMoreO } from "react-icons/cg";
import { AddIcon, CheckIcon } from "@chakra-ui/icons";
import { formatDistanceToNow } from "date-fns";
import React, { useState, useCallback, useEffect, useMemo, memo } from "react";
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
import useFollowUnfollow from "@hooks/useFollowUnfollow";

// Memoized components để tránh re-render không cần thiết
const PostHeader = memo(({ post, postedBy, navigateToProfile }) => (
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
                    <IconButton size="xs" icon={<MdNavigateNext />} variant="ghost" />
                    <Text fontSize="sm" fontWeight="hairline">{post.tags}</Text>
                </>
            )}
            <Text fontSize="xs" color="gray.500">
                {formatDistanceToNow(new Date(post.createdAt))}
            </Text>
        </Flex>
    </Flex>
));

const FollowButton = memo(({ following, updating, handleFollowUnfollow }) => (
    <AvatarBadge boxSize="1.2em" bg="white" shadow="sm">
        <Tooltip label={following ? "Following" : "Follow"} hasArrow placement="top">
            <IconButton
                borderRadius="full"
                icon={following ? <CheckIcon /> : <AddIcon />}
                size="xs"
                w="1em"
                h="1em"
                minW="1em"
                minH="1em"
                colorScheme={following ? "green" : "blue"}
                variant="solid"
                aria-label={following ? "Unfollow" : "Follow"}
                isLoading={updating}
                _hover={{ transform: "scale(1.05)" }}
                transition="transform 0.2s ease"
                onClick={(e) => {
                    e.stopPropagation();
                    handleFollowUnfollow();
                }}
            />
        </Tooltip>
    </AvatarBadge>
));

const RepostedBySection = memo(({ repostedBy }) => (
    <Flex fontSize="xs" color="gray.500" wrap="wrap" align="center" mb={2}>
        <Text mr={1} fontWeight="medium">Reposted by:</Text>
        {repostedBy.map((user, index) => (
            <React.Fragment key={user.username}>
                <Link to={`/user/${user.username}`} style={{ color: 'blue' }}>
                    <Text as="span" _hover={{ textDecoration: "underline" }}>
                        {user.username}
                    </Text>
                </Link>
                {index < repostedBy.length - 1 && <Text mx={1}>,</Text>}
            </React.Fragment>
        ))}
    </Flex>
));

const PostMenu = memo(({ currentUser, postedBy, onOpen, timeLeft, openUpdateModal, setIsReportOpen }) => (
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
                            post={{ timeLeft }}
                            handleOpenUpdatePost={openUpdateModal}
                        />
                    )}
                </>
            ) : (
                <MenuItem onClick={() => setIsReportOpen(true)}>Report Post</MenuItem>
            )}
        </MenuList>
    </Menu>
));

const Post = ({ post, postedBy, onPostUpdate, type, referrer }) => {
    const showToast = useShowToast();
    const currentUser = useRecoilValue(userAtom);
    const navigate = useNavigate();
    const { isOpen: isDeleteOpen, onOpen, onClose } = useDisclosure();
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [posts, setPosts] = useRecoilState(postsAtom);
    const [isUpdatePostOpen, setIsUpdatePostOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const { handleFollowUnfollow, following, updating } = useFollowUnfollow(postedBy);

    // Memoized values
    const isOwnPost = useMemo(() => currentUser?._id === postedBy._id, [currentUser?._id, postedBy._id]);
    const shouldShowReposted = useMemo(() => type === "followed" && post.repostedBy?.length > 0, [type, post.repostedBy?.length]);
    const hasMedia = useMemo(() => post.media?.length > 0, [post.media?.length]);
    const hasTags = useMemo(() => post.tags?.length > 0, [post.tags?.length]);

    // Optimized timer effect
    useEffect(() => {
        if (!isOwnPost) return;

        const expireTime = new Date(post.createdAt).getTime() + 10 * 60 * 1000;
        const updateTimer = () => {
            const remaining = expireTime - Date.now();
            setTimeLeft(Math.max(remaining, 0));
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [post.createdAt, isOwnPost]);

    // Memoized callbacks
    const handleDeletePost = useCallback(async () => {
        if (isDeleting) return;

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
    }, [post._id, showToast, setPosts, onClose, isDeleting]);

    const navigateToProfile = useCallback((e) => {
        e.preventDefault();
        if (postedBy?.username !== currentUser?.username) {
            navigate(`/user/${postedBy.username}`);
        }
    }, [postedBy?.username, currentUser?.username, navigate]);

    const handleNavigatePostPage = useCallback((e) => {
        e.preventDefault();
        sessionStorage.setItem("referrer", JSON.stringify(referrer));
        sessionStorage.setItem("scrollToPostId", post._id);
        navigate(`/${postedBy.username}/post/${post._id}`);
    }, [referrer, post._id, postedBy.username, navigate]);

    const openUpdateModal = useCallback(() => setIsUpdatePostOpen(true), []);
    const closeUpdateModal = useCallback(() => setIsUpdatePostOpen(false), []);

    // Early return cho performance
    if (!post || !postedBy) return null;

    return (
        <>
            <Box
                w="full"
                id={`post-${post._id}`}
                borderRadius="md"
                boxShadow="sm"
                mb={1}
                p={3}
                _hover={{ boxShadow: "md" }}
                transition="box-shadow 0.2s ease"
            >
                {shouldShowReposted && (
                    <RepostedBySection repostedBy={post.repostedBy} />
                )}

                <Flex gap={3}>
                    <Avatar
                        size="md"
                        name={postedBy.username}
                        src={postedBy.profilePic}
                        onClick={navigateToProfile}
                        cursor="pointer"
                        loading="lazy"
                    >
                        {!isOwnPost && (
                            <FollowButton
                                following={following}
                                updating={updating}
                                handleFollowUnfollow={handleFollowUnfollow}
                            />
                        )}
                    </Avatar>

                    <Flex flex={1} flexDirection="column" gap={2}>
                        <Flex justify="space-between" align="center">
                            <PostHeader
                                post={post}
                                postedBy={postedBy}
                                navigateToProfile={navigateToProfile}
                            />
                            <PostMenu
                                currentUser={currentUser}
                                postedBy={postedBy}
                                onOpen={onOpen}
                                timeLeft={timeLeft}
                                openUpdateModal={openUpdateModal}
                                setIsReportOpen={setIsReportOpen}
                            />
                        </Flex>

                        <Box
                            fontSize="sm"
                            whiteSpace="pre-wrap"
                            wordBreak="break-word"
                            onClick={handleNavigatePostPage}
                            cursor="pointer"
                            _hover={{ color: "blue.500" }}
                            transition="color 0.2s ease"
                        >
                            {renderMentionText(post.text)}
                        </Box>

                        {hasMedia && (
                            <Box mt={2} borderRadius="md" overflow="hidden" maxW="600px">
                                <Carousels medias={post.media} />
                            </Box>
                        )}

                        <Actions post={post} onPostUpdate={onPostUpdate} />
                    </Flex>
                </Flex>
                <Divider mt={4} />
            </Box>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent bg={useColorModeValue('gray.100', 'gray.dark')}>
                    <ModalHeader fontSize="xl" fontWeight="bold" textAlign="center">
                        Delete Post
                    </ModalHeader>
                    <Divider maxWidth="90%" mx="auto" />
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
                            loadingText="Deleting..."
                        >
                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Report Dialog */}
            {isReportOpen && (
                <ReportDialog
                    type="post"
                    isOpen={isReportOpen}
                    onClose={() => setIsReportOpen(false)}
                    post={post}
                    postedBy={postedBy}
                />
            )}

            {/* Update Modal */}
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
    type: PropTypes.string,
    referrer: PropTypes.object,
};

PostHeader.displayName = 'PostHeader';
FollowButton.displayName = 'FollowButton';
RepostedBySection.displayName = 'RepostedBySection';
PostMenu.displayName = 'PostMenu';

export default memo(Post);