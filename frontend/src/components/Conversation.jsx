import {
    Avatar,
    AvatarBadge,
    Badge,
    Flex,
    Stack,
    Text,
    WrapItem,
    useColorMode,
    useColorModeValue,
} from "@chakra-ui/react";
import PropTypes from 'prop-types';
import { useRecoilState, useRecoilValue } from "recoil";
import { BsFillImageFill } from "react-icons/bs";
import { TiTick } from "react-icons/ti";
import { selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { useSocket } from "@context/SocketContext";
import ShowAvatarGroup from "./AvatarGroup.jsx";

const Conversation = ({ conversation, isOnline, onDelete }) => {
    const currentUser = useRecoilValue(userAtom);
    const user = conversation.participants.find((p) => p._id !== currentUser._id);
    const lastMessage = conversation.lastMessage;
    const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
    const colorMode = useColorMode();
    const { socket } = useSocket();

    const getLastMessageText = () => {
        if (!lastMessage?.text) return <BsFillImageFill size={16} />;
        return lastMessage.text.length > 18
            ? lastMessage.text.substring(0, 18) + "..."
            : lastMessage.text;
    };
    const handle = () => {
        setSelectedConversation({
            _id: conversation._id,
            isGroup: conversation.isGroup,

            ...(conversation.isGroup
                ? {
                    groupName: conversation.groupName,
                    participants: conversation.participants,
                    groupAdmin: conversation.groupAdmin,
                }
                : {
                    userId: user._id,
                    userProfilePic: user.profilePic,
                    username: user.username,
                }),
            mock: conversation.mock,
        });

        if (socket) {
            socket.emit("markMessagesAsSeen", {
                conversationId: conversation._id,
                userId: currentUser._id,
            });
        }
    }
    return (
        <>
            <Flex
                mt={2}
                gap={4}
                alignItems={"center"}
                p={"1"}
                position="relative"
                _hover={{
                    cursor: "pointer",
                    bg: useColorModeValue("gray.600", "gray.dark"),
                    color: "white",
                }}
                onClick={() => handle()}
                bg={
                    selectedConversation?._id === conversation._id ? (colorMode === "light" ? "white" : "gray.dark") : ""
                }
                borderRadius={"md"}
                justifyContent="space-between"

            >
                <Flex gap={4} alignItems={"center"}>
                    <WrapItem>
                        {conversation.isGroup ? (
                            <ShowAvatarGroup users={conversation.participants} />
                        ) : (<Avatar
                            size={{ base: "xs", sm: "sm", md: "md" }}
                            src={user.profilePic}
                        >
                            <AvatarBadge boxSize='1em' bg={isOnline ? 'green.500' : 'red.500'} />
                        </Avatar>)}
                    </WrapItem>

                    <Stack direction={"column"} fontSize={"sm"}>
                        <Text fontWeight='700' display={"flex"} alignItems={"center"}>
                            {conversation.isGroup ? conversation.groupName : user.username}
                        </Text>
                        <Text fontSize={"xs"} display={"flex"} alignItems={"center"} gap={1}>
                            {lastMessage?.sender && currentUser._id === lastMessage.sender && (
                                <span color={lastMessage?.seen ? "blue.400" : ""}>
                                    <TiTick size={16} />
                                </span>
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
                </Flex>
            </Flex>
        </>
    );
};

Conversation.propTypes = {
    conversation: PropTypes.object.isRequired,
    isOnline: PropTypes.bool.isRequired,
};

export default Conversation;

