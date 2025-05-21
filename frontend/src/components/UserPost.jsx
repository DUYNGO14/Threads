import {
    Avatar,
    Box,
    Button,
    Flex,
    IconButton,
    Image,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    useColorModeValue
} from "@chakra-ui/react";
import PropTypes from 'prop-types';
import Carousels from "./Carousels";
import { formatDistanceToNow } from "date-fns";
import { MdNavigateNext } from "react-icons/md";
import { renderMentionText } from "./renderMentionText";

const UserPost = ({ post, isOpen, onClose }) => {
    const postedBy = post.postedBy;
    const bg = useColorModeValue('gray.100', 'gray.800');

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent bg={bg} maxW="700px">
                <ModalHeader textAlign={"center"} >Post Details</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Flex gap={4} mb={4} py={2} >
                        {/* Avatar + Vertical Line */}
                        <Flex flexDirection="column" alignItems="center">
                            <Avatar size="md" name={postedBy.username} src={postedBy.profilePic} />

                        </Flex>

                        {/* Content */}
                        <Flex flex={1} flexDirection="column" gap={3}>
                            {/* Header */}
                            <Flex justifyContent="space-between" alignItems="center">
                                <Flex alignItems="center" wrap="wrap">
                                    <Text fontSize="sm" fontWeight="bold" mr={2}>{postedBy.username}</Text>
                                    {post.tags && post.tags.length > 0 && (
                                        <>
                                            <IconButton
                                                size="xs"
                                                icon={<MdNavigateNext />}
                                                aria-label="Next"
                                                variant="ghost"
                                                mr={1}
                                            />
                                            <Text fontSize="sm" color="gray.500">
                                                {post.tags}
                                            </Text>
                                        </>
                                    )}
                                    <Text fontSize="sm" color="gray.500" ml={2}>
                                        {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "Just now"}
                                    </Text>
                                </Flex>
                            </Flex>

                            {/* Text */}
                            <Flex fontSize="sm" whiteSpace="pre-wrap" wordBreak="break-word">
                                {renderMentionText(post.text)}
                            </Flex>
                            {/* Media */}
                            {post.media && post.media.length > 0 && (
                                <Carousels medias={post.media} />
                            )}
                        </Flex>
                    </Flex>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={onClose}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

UserPost.propTypes = {
    post: PropTypes.object.isRequired,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default UserPost;
