import { Avatar, Box, Flex, IconButton, Image, Text } from "@chakra-ui/react";
import { BsThreeDots } from "react-icons/bs";
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';
import Carousels from "./Carousels";
import { formatDistanceToNow } from "date-fns";
import { MdNavigateNext } from "react-icons/md";
import { renderMentionText } from "./renderMentionText";
const UserPost = ({ post }) => {
    const postedBy = post.postedBy;
    return (
        <Link to={`/${postedBy.username}/post/${post._id}`}>
            <Flex gap={3} mb={4} py={5} maxW="container.lg">
                <Flex flexDirection="column" alignItems="center">
                    <Avatar size="md" name={postedBy.username} src={postedBy.profilePic} />
                    <Box w="1px" h="full" bg="gray.light" my={2}></Box>
                </Flex>
                <Flex flex={1} flexDirection="column" gap={2}>
                    <Flex justifyContent="space-between" w="full">
                        <Flex w="full" alignItems="center">
                            <Text fontSize="sm" fontWeight="bold" mr={2}>{postedBy.username}</Text>
                            {post.tags && post.tags.length > 0 && (
                                <>
                                    <IconButton size="xs" icon={<MdNavigateNext />} aria-label="Next" mr={2} />
                                    <Text fontSize="sm" fontWeight="hairline">
                                        {post.tags}
                                    </Text>
                                </>
                            )}
                        </Flex>
                        <Flex gap={4} alignItems="center">
                            <Text fontSize="sm" color="gray.light">{post.createdAt ? formatDistanceToNow(new Date(post.createdAt)) : "Just now"}</Text>

                        </Flex>
                    </Flex>
                    <Text fontSize="sm"> {renderMentionText(post.text)}</Text>
                    {post.media && (
                        <Box borderRadius={6} overflow="hidden" >
                            <Carousels medias={post.media} />
                        </Box>
                    )}
                </Flex>
            </Flex>
        </Link>
    );
};

UserPost.propTypes = {
    postImg: PropTypes.string.isRequired,
    postTitle: PropTypes.string.isRequired,
    likes: PropTypes.number.isRequired,
    replies: PropTypes.number.isRequired,
};
export default UserPost;
