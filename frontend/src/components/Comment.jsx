import {
    Avatar, Box, Divider, Flex, Menu, MenuButton, MenuItem, MenuList,
    Portal, Text, useColorModeValue
} from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import { CgMoreO } from "react-icons/cg";
import { Link } from "react-router-dom";
import DeleteReplyModal from "./Modal/DeleteReplyModal";
import EditReplyModal from "./Modal/EditReplyModal";
import useReplyModalManager from "../hooks/useReplyModalManager";
const Comment = ({ reply, lastReply, postId, currentUser, onReplyUpdate, onReplyDelete }) => {
    const isMyComment = currentUser?.username === reply.username;
    const {
        isOpen,
        modalType,
        openModal,
        closeModal,
    } = useReplyModalManager();
    return (
        <>
            <Flex gap={4} py={2} my={2} w={"full"}>
                <Avatar src={reply.userProfilePic} size={"sm"} />
                <Flex gap={1} w={"full"} flexDirection={"column"}>
                    <Flex w={"full"} justifyContent={"space-between"} alignItems={"center"}>
                        <Link to={`/${reply.username}`}>
                            <Text fontSize='sm' fontWeight='bold'>{reply.username}</Text>
                        </Link>
                        <Text fontSize={"xs"} color={"gray.500"}>
                            {reply.createdAt ? formatDistanceToNow(new Date(reply.createdAt)) : "Just now"} ago
                        </Text>
                    </Flex>

                    <Text>{reply.text}</Text>
                </Flex>
                <Flex>
                    <Box className='icon-container'>
                        <Menu placement="bottom-start">
                            <MenuButton>
                                <CgMoreO size={24} cursor={"pointer"} />
                            </MenuButton>
                            <Portal>
                                <MenuList bg={useColorModeValue("white", "gray.dark")}>
                                    {isMyComment && (
                                        <>
                                            <MenuItem onClick={() => openModal("edit")}>Edit</MenuItem>
                                            <MenuItem onClick={() => openModal("delete")}>Delete</MenuItem>

                                        </>
                                    )}
                                    <MenuItem onClick={() => { }}>Report</MenuItem>
                                </MenuList>
                            </Portal>
                        </Menu>
                    </Box>
                </Flex>
            </Flex>

            {!lastReply && <Divider />}

            <EditReplyModal
                isOpen={isOpen && modalType === "edit"}
                onClose={closeModal}
                postId={postId}
                replyId={reply._id}
                initialText={reply.text}
                onSuccess={onReplyUpdate}
            />

            <DeleteReplyModal
                isOpen={isOpen && modalType === "delete"}
                onClose={closeModal}
                postId={postId}
                replyId={reply._id}
                onSuccess={onReplyDelete}
            />
        </>
    );
};
export default Comment;