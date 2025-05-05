import {
    Avatar,
    AvatarBadge,
    Badge,
    Box,
    Flex,
    IconButton,
    Stack,
    Text,
    WrapItem,
    useColorMode,
    useColorModeValue,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    useDisclosure,
} from "@chakra-ui/react";
import moment from "moment";
import { useState } from "react";
import PropTypes from 'prop-types';
import { useRecoilState, useRecoilValue } from "recoil";
import { BsFillImageFill, BsThreeDotsVertical } from "react-icons/bs";
import { TiTick } from "react-icons/ti";
import { selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { useSocket } from "@context/SocketContext";
import { useNavigate } from "react-router-dom";
import DeleteConfirmationModal from "./Modal/DeleteConfirmationModal"; // Import modal đã tách
import useShowToast from "@hooks/useShowToast";
import api from "../services/api.js";

const Conversation = ({ conversation, isOnline, isMobile = false, onDelete }) => {
    const [hovered, setHovered] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const currentUser = useRecoilValue(userAtom);
    const user = conversation.participants.find((p) => p._id !== currentUser._id);
    const lastMessage = conversation.lastMessage;
    const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
    const colorMode = useColorMode();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const showToast = useShowToast();
    const backgroundColor = useColorModeValue("white", "gray.dark");
    const handleDelete = async () => {
        try {
            const res = await api.delete(`/api/conversations/delete/${conversation._id}`);
            const data = await res.data;
            if (res.status === 200) {
                onDelete(conversation._id);
                showToast("Success", data.message, "success");
            } else {
                console.error(data.message || "Xóa thất bại");
            }
        } catch (err) {
            console.error(err);
        } finally {
            onClose();
        }
    };
    const getLastMessageText = () => {
        if (!lastMessage?.text) return <BsFillImageFill size={16} />;
        return lastMessage.text.length > 18
            ? lastMessage.text.substring(0, 18) + "..."
            : lastMessage.text;
    };

    return (
        <>
            <Flex
                gap={4}
                alignItems={"center"}
                p={"1"}
                position="relative"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                _hover={{
                    cursor: "pointer",
                    bg: useColorModeValue("gray.600", "gray.dark"),
                    color: "white",
                }}
                onClick={() => {
                    setSelectedConversation({
                        _id: conversation._id,
                        userId: user._id,
                        userProfilePic: user.profilePic,
                        username: user.username,
                        mock: conversation.mock,
                    });
                    if (socket) {
                        socket.emit("markMessagesAsSeen", {
                            conversationId: conversation._id,
                            userId: currentUser._id,
                        });
                    }
                }}
                bg={
                    selectedConversation?._id === conversation._id ? (colorMode === "light" ? "w" : "gray.dark") : ""
                }
                borderRadius={"md"}
                justifyContent="space-between"
            >
                <Flex gap={4} alignItems={"center"}>
                    <WrapItem>
                        <Avatar
                            size={{ base: "xs", sm: "sm", md: "md" }}
                            src={user.profilePic}
                        >
                            <AvatarBadge boxSize='1em' bg={isOnline ? 'green.500' : 'red.500'} />
                        </Avatar>
                    </WrapItem>

                    <Stack direction={"column"} fontSize={"sm"}>
                        <Text fontWeight='700' display={"flex"} alignItems={"center"}>
                            {user.username}
                        </Text>
                        <Text fontSize={"xs"} display={"flex"} alignItems={"center"} gap={1}>
                            {currentUser._id === lastMessage.sender && (
                                <Box color={lastMessage.seen ? "blue.400" : ""}>
                                    <TiTick size={16} />
                                </Box>
                            )}
                            {getLastMessageText()}
                        </Text>
                    </Stack>
                </Flex>

                <Flex alignItems="center" gap={2} minW="50px" justifyContent="flex-end">
                    {conversation.unreadCount > 0 && (
                        <Badge colorScheme="red" borderRadius="full" px={2} fontSize="xs">
                            {conversation.unreadCount}
                        </Badge>
                    )}
                    <Box width="24px" height="24px">
                        {hovered && (
                            <Menu>
                                <MenuButton
                                    as={IconButton}
                                    icon={<BsThreeDotsVertical />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <MenuList bg={backgroundColor}>
                                    <MenuItem onClick={() => { navigate(`/${user.username}`) }}>Xem người dùng</MenuItem>
                                    <MenuItem onClick={(e) => { e.stopPropagation(); onOpen(); }}>Xóa cuộc trò chuyện</MenuItem>
                                </MenuList>
                            </Menu>
                        )}
                    </Box>
                </Flex>
            </Flex>

            {/* Modal xác nhận xóa */}
            <DeleteConfirmationModal
                isOpen={isOpen}
                onClose={onClose}
                onConfirm={handleDelete}
            />
        </>
    );
};

Conversation.propTypes = {
    conversation: PropTypes.object.isRequired,
    isOnline: PropTypes.bool.isRequired,
};

export default Conversation;

