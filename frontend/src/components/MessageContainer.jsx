import {
    Divider,
    Flex,
    Spinner,
    useColorModeValue,
} from "@chakra-ui/react";
import MessageInput from "./MessageInput";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
    messagesAtom,
    selectedConversationAtom,
} from "../atoms/messagesAtom";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { useSocket } from "@context/SocketContext.jsx";

import { useMarkSeen } from "../hooks/useChatSocket.js";
import useMessageSocket from "../hooks/useMessageSocket.js";
import useInitialMessages from "../hooks/useGetMessages.js";
import useMessageScroll from "../hooks/useMessageScroll.js";
import MessageHeader from "./Messages/MessageHeader.jsx";
import ListMessages from "./Messages/ListMessages.jsx";

const MessageContainer = ({
    isOnline,
    onClose,
    setShowChatSettings,
    showChatSettings,
}) => {
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const [messages, setMessages] = useRecoilState(messagesAtom);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const messagesContainerRef = useRef(null);

    const currentUser = useRecoilValue(userAtom);
    const { socket } = useSocket();

    const messageEndRef = useRef(null);

    const { loadingMessages } = useInitialMessages(setMessages, setHasMore);

    useMessageScroll(
        messagesContainerRef,
        messages,
        setMessages,
        hasMore,
        setHasMore,
        setLoadingMore
    );

    useMessageSocket(setMessages);
    useMarkSeen(messages);

    useLayoutEffect(() => {
        if (!loadingMessages && messages.length) {
            messageEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
        }
    }, [messages, loadingMessages]);

    useEffect(() => {
        const handleSeen = ({ conversationId }) => {
            if (selectedConversation._id === conversationId) {
                setMessages((prev) =>
                    prev.map((message) => ({ ...message, seen: true }))
                );
            }
        };
        socket.on("messagesSeen", handleSeen);
        return () => {
            socket.off("messagesSeen", handleSeen);
        };
    }, [selectedConversation._id, socket, setMessages]);

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
            <MessageHeader
                onClose={onClose}
                setShowChatSettings={setShowChatSettings}
                showChatSettings={showChatSettings}
                selectedConversation={selectedConversation}
                isOnline={isOnline}
            />

            <Divider my={2} />

            <Flex
                ref={messagesContainerRef}
                flex="1"
                direction="column"
                overflowY="auto"
                p={2}
                gap={3}
            >
                {loadingMore && (
                    <Spinner color="teal.500" />
                )}
                <ListMessages
                    messages={messages}
                    loadingMessages={loadingMessages}
                    messageEndRef={messageEndRef}
                    currentUser={currentUser}
                />
            </Flex>

            <MessageInput setMessages={setMessages} />
        </Flex>
    );
};

export default MessageContainer;
