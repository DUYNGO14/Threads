import { Avatar, AvatarBadge, Badge, Divider, Flex, IconButton, Image, Skeleton, SkeletonCircle, Text, useColorModeValue, WrapItem } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { useEffect, useRef, useState } from "react";
import useShowToast from "@hooks/useShowToast";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { useSocket } from "@context/SocketContext.jsx";
import messageSound from "../assets/sounds/message.mp3";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
const MessageContainer = ({ isOnline, onClose }) => {
    const showToast = useShowToast();
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [messages, setMessages] = useState([]);
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
        const handleNewMessage = (message) => {
            if (selectedConversationRef.current._id === message.conversationId) {
                setMessages((prev) => [...prev, message]);
            }

            if (!document.hasFocus()) {
                const sound = new Audio(messageSound);
                sound.play();
            }

            setConversations((prev) => {
                return prev.map((conversation) =>
                    conversation._id === message.conversationId
                        ? {
                            ...conversation,
                            lastMessage: {
                                text: message.text,
                                sender: message.sender,
                            },
                        }
                        : conversation
                );
            });
        };

        socket.on("newMessage", handleNewMessage);
        return () => socket.off("newMessage", handleNewMessage);
    }, [socket, setConversations]);


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
                const res = await api.get(`api/messages/${selectedConversation.userId}`);
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

        if (selectedConversation.userId) getMessages();
    }, [showToast, selectedConversation.userId, selectedConversation.mock]);
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

        >
            {/* Message header */}
            <Flex cursor={"pointer"} w={"full"} h={12} alignItems={"center"} gap={2} >
                <Flex onClick={() => { navigate(`/user/${selectedConversation.username}`) }}>
                    <WrapItem mr={2}>
                        <Avatar
                            size={{
                                base: "xs",
                                sm: "sm",
                                md: "md",
                            }}
                            src={selectedConversation.userProfilePic}
                        >
                            {isOnline ? <AvatarBadge boxSize='1em' bg='green.500' /> : <AvatarBadge boxSize='1em' bg='red.500' />}
                        </Avatar>
                    </WrapItem >
                    <Text display={"flex"} alignItems={"center"} >
                        {selectedConversation.username}
                    </Text>

                </Flex>
                {isOnline ? (<Badge colorScheme="green">Online</Badge>) : (<Badge colorScheme="red">Offline</Badge>)}
                <IconButton
                    icon={<CloseIcon />}
                    aria-label="Close conversation"
                    onClick={onClose}
                    variant="ghost"
                    colorScheme="red"
                    ml="auto"
                />
            </Flex>

            <Divider my={2} />

            <Flex flexDir={"column"} gap={4} my={4} p={2} height={"400px"} w={"full"} overflowY={"auto"}>
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

                {!loadingMessages &&
                    messages.map((message) => (

                        <Flex
                            key={message._id}
                            direction={"column"}
                            ref={messages.length - 1 === messages.indexOf(message) ? messageEndRef : null}
                        >
                            <Message message={message} ownMessage={currentUser._id === message.sender} />
                        </Flex>
                    ))}
            </Flex>

            <MessageInput setMessages={setMessages} />
        </Flex>
    );
};

export default MessageContainer;

