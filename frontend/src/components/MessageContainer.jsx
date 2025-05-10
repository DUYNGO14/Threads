import { Avatar, AvatarBadge, Badge, Box, Divider, Flex, Icon, IconButton, Image, Skeleton, SkeletonCircle, Text, useColorModeValue, WrapItem } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { useEffect, useRef, useState } from "react";
import useShowToast from "@hooks/useShowToast";
import { conversationsAtom, messagesAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { useSocket } from "@context/SocketContext.jsx";
import messageSound from "../assets/sounds/message.mp3";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { PiWarningCircleBold } from "react-icons/pi";
import ShowAvatarGroup from "./AvatarGroup.jsx";
const MessageContainer = ({ isOnline, onClose, setShowChatSettings, showChatSettings }) => {
    const showToast = useShowToast();
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [messages, setMessages] = useRecoilState(messagesAtom);
    const currentUser = useRecoilValue(userAtom);
    const { socket } = useSocket();
    const setConversations = useSetRecoilState(conversationsAtom);
    const messageEndRef = useRef(null);
    const navigate = useNavigate();
    const selectedConversationRef = useRef(selectedConversation);
    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);
    useEffect(() => {
        if (selectedConversation && selectedConversation._id) {
            socket.emit("joinRoom", selectedConversation._id); // tham gia room
        }

        return () => {
            if (selectedConversation && selectedConversation._id) {
                socket.emit("leaveRoom", selectedConversation._id); // rời room khi đổi hoặc thoát
            }
        };
    }, [selectedConversation._id, socket]);

    useEffect(() => {
        const handleNewMessage = (message) => {
            if (selectedConversation._id === message.conversationId) {
                setMessages((prev) => [...prev, message]);
            }

            if (!document.hasFocus()) {
                const sound = new Audio(messageSound);
                sound.play();
            }

            setConversations((prev) =>
                prev.map((conversation) =>
                    conversation._id === message.conversationId
                        ? {
                            ...conversation,
                            lastMessage: {
                                text: message.text,
                                sender: message.sender,
                            },
                        }
                        : conversation
                )
            );
        };

        socket.on("newMessage", handleNewMessage);
        return () => socket.off("newMessage", handleNewMessage);
    }, [socket, setConversations, selectedConversation._id]);

    useEffect(() => {
        if (
            messages.length &&
            messages[messages.length - 1].sender !== currentUser._id
        ) {
            socket.emit("markMessagesAsSeen", {
                conversationId: selectedConversation._id,
                userId: selectedConversation.userId,
            });
        }
    }, [messages, currentUser._id, selectedConversation, socket]);
    useEffect(() => {
        const handleSeen = ({ conversationId }) => {
            if (selectedConversation._id === conversationId) {
                setMessages((prev) =>
                    prev.map((message) => ({ ...message, seen: true }))
                );
            }
        };

        socket.on("messagesSeen", handleSeen);
        return () => socket.off("messagesSeen", handleSeen);
    }, [selectedConversation._id, socket]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const getMessages = async () => {
            setLoadingMessages(true);
            setMessages([]);
            try {
                if (selectedConversation.mock) return;

                let res;
                if (selectedConversation.isGroup) {
                    res = await api.get(`/api/messages?conversationId=${selectedConversation._id}`);
                } else {
                    res = await api.get(`/api/messages?otherUserId=${selectedConversation.userId}`);
                }

                const data = await res.data;
                if (data.error) {
                    showToast("Error", data.error, "error");
                    return;
                }
                setMessages(data);
            } catch (error) {
                showToast("Error", error.message, "error");
            } finally {
                setLoadingMessages(false);
            }
        };

        if (selectedConversation._id) getMessages();
    }, [
        showToast,
        selectedConversation._id,
        selectedConversation.userId,
        selectedConversation.mock,
        selectedConversation.isGroup,
        setMessages,
    ]);

    return (

        <Flex
            flex="70"
            bg={useColorModeValue("gray.200", "gray.dark")}
            borderRadius={"md"}
            p={2}
            flexDirection={"column"}
            overflow={"hidden"}
            position={"relative"}
            h={"full"}
            w={"full"}
        >
            {/* Message header */}
            <Flex cursor={"pointer"} w={"full"} alignItems={"center"} gap={2} justifyContent={"space-between"}>
                <Flex >
                    <WrapItem mr={2}>
                        {selectedConversation.isGroup ? (
                            <ShowAvatarGroup users={selectedConversation.participants} />
                        ) : (<Avatar
                            size={{
                                base: "xs",
                                sm: "sm",
                                md: "md",
                            }}
                            src={selectedConversation.userProfilePic}
                        >

                            {isOnline ? <AvatarBadge boxSize='1em' bg='green.500' /> : <AvatarBadge boxSize='1em' bg='red.500' />}
                        </Avatar>)}

                    </WrapItem >
                    <Box>
                        <Text ml={2} display={"flex"} alignItems={"center"} >
                            {selectedConversation.username || selectedConversation.groupName}
                        </Text>
                        {!selectedConversation.isGroup && (
                            <Badge ml={2} size={"xs"} colorScheme={isOnline ? "green" : "red"}>
                                {isOnline ? "Online" : "Offline"}
                            </Badge>
                        )}
                    </Box>
                </Flex>


                <Flex>
                    <IconButton
                        icon={<PiWarningCircleBold />}
                        aria-label="Close conversation"
                        onClick={() => setShowChatSettings(!showChatSettings)}
                        variant="ghost"
                        colorScheme="white"
                        mx={2}
                    />
                    <IconButton
                        icon={<CloseIcon />}
                        aria-label="Close conversation"
                        onClick={onClose}
                        variant="ghost"
                        colorScheme="red"
                    />
                </Flex>

            </Flex>

            <Divider my={2} />

            <Flex flexDir={"column"} gap={4} my={4} p={2} height={"full"} w={"full"} overflowY={"auto"}>
                {loadingMessages &&
                    [...Array(5)].map((_, i) => (
                        <Flex
                            key={i}
                            gap={2}
                            alignItems={"center"}
                            p={1}
                            borderRadius={"md"}
                            alignSelf={i % 2 === 0 ? "flex-start" : "flex-end"}
                        >
                            {i % 2 === 0 && <SkeletonCircle size={7} />}
                            <Flex flexDir={"column"} gap={2}>
                                <Skeleton h='8px' w='250px' />
                                <Skeleton h='8px' w='250px' />
                                <Skeleton h='8px' w='250px' />
                            </Flex>
                            {i % 2 !== 0 && <SkeletonCircle size={7} />}
                        </Flex>
                    ))}

                {!loadingMessages ? (
                    messages && messages.length > 0 ? (
                        messages.map((message, index) =>
                            message.isSystem ? (
                                <Text
                                    key={message._id}
                                    fontSize="sm"
                                    textAlign="center"
                                    color="gray.500"
                                    ref={messages.length - 1 === index ? messageEndRef : null}
                                >
                                    {message.text}
                                </Text>
                            ) : (
                                <Message
                                    key={message._id}
                                    ref={messages.length - 1 === index ? messageEndRef : null}
                                    message={message}
                                    ownMessage={currentUser._id === message.sender._id}
                                />
                            )
                        )
                    ) : (
                        <Flex h="full" alignItems="center" justifyContent="center" w="full">
                            No messages yet
                        </Flex>
                    )
                ) : null}

            </Flex>
            <MessageInput setMessages={setMessages} />
        </Flex>
    );
};

export default MessageContainer;

