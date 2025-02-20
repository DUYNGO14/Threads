import { SearchIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Input, Skeleton, SkeletonCircle, Text, useColorModeValue } from "@chakra-ui/react"
import Conversation from "../components/Conversation";
import MessageContainer from "../components/MessageContainer";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { GiConversation } from "react-icons/gi";
import { useSocket } from "../context/SocketContext";
const ChatPage = () => {
    const [conversations, setConversations] = useRecoilState(conversationsAtom);
    const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [searchingUser, setSearchingUser] = useState(false);
    const currentUser = useRecoilValue(userAtom);
    const showToast = useShowToast();
    const { socket, onlineUsers } = useSocket();

    useEffect(() => {
        socket?.on("messageSeen", ({ conversationId }) => {
            setConversations((prev) => {
                const updateConversations = prev.map((conversation) => {
                    if (conversation._id === conversationId) {
                        return {
                            ...conversation,
                            lastMessage: {
                                ...conversation.lastMessage,
                                seen: true
                            }
                        }
                    } else {
                        return conversation;
                    }
                })
                return updateConversations;
            })
        })
    }, [socket, setConversations]);

    const handleConversationSearch = async (e) => {
        e.preventDefault();
        setSearchingUser(true);
        try {
            if (searchText === "") return
            const res = await fetch(`/api/users/profile/${searchText}`);
            const searchedUser = await res.json();
            if (searchedUser.error) {
                showToast("Error", searchedUser.error, "error");
                return;
            }
            if (searchedUser._id === currentUser._id) {
                showToast("Error", "Cannot search yourself", "error");
                return;
            }
            const conversationAlreadyExists = conversations.find(
                (conversation) => conversation.participants[0]._id === searchedUser._id
            );
            if (conversationAlreadyExists) {
                setSelectedConversation({
                    _id: conversationAlreadyExists._id,
                    userId: searchedUser._id,
                    username: searchedUser.username,
                    userProfilePic: searchedUser.profilePic,
                });
                return;
            }
            const mockConversation = {
                mock: true,
                lastMessage: {
                    text: "",
                    sender: "",
                },
                _id: Date.now(),
                participants: [
                    {
                        _id: searchedUser._id,
                        username: searchedUser.username,
                        profilePic: searchedUser.profilePic,
                    },
                ],
            };
            setConversations((prevConvs) => [...prevConvs, mockConversation]);
        } catch (error) {
            showToast("Error", error.message, "error");
        } finally {
            setSearchingUser(false);
        }
    };
    useEffect(() => {
        const getConversations = async () => {
            try {
                const res = await fetch("/api/messages/conversations");
                const data = await res.json();
                if (data.error) {
                    showToast("Error", data.error, "error");
                    return;
                }
                setConversations(data);
            } catch (error) {
                showToast("Error", error.message, "error");
            } finally {
                setLoadingConversations(false);
            }
        };
        getConversations();
    }, [showToast, setConversations]);
    return (
        <Box
            position={"absolute"}
            left={"50%"}
            w={{ base: "100%", md: "80%", lg: "750px" }}
            p={4}
            transform={"translateX(-50%)"}>
            <Flex
                gap={4}
                flexDirection={{ base: "column", md: "row" }}
                maxW={{
                    sm: "400px",
                    md: "full",
                }}
                mx={"auto"}>
                <Flex
                    flex={30}
                    gap={2}
                    flexDirection={"column"}
                    maxW={{ sm: "250px", md: "full" }}
                    mx={"auto"}>
                    <Text
                        fontWeight={700}
                        color={useColorModeValue("gray.600", "gray.400")}>
                        Your Conversations
                    </Text>
                    <form onSubmit={handleConversationSearch}>
                        <Flex alignItems={"center"} gap={2}>
                            <Input placeholder='Search for a user' onChange={(e) => setSearchText(e.target.value)} />
                            <Button size={"sm"} type="submit" isLoading={searchingUser}>
                                <SearchIcon />
                            </Button>
                        </Flex>
                    </form>
                    {loadingConversations &&
                        [0, 1, 2, 3, 4].map((_, i) => (
                            <Flex key={i} gap={4} alignItems={"center"} p={"1"} borderRadius={"md"}>
                                <Box>
                                    <SkeletonCircle size={"10"} />
                                </Box>
                                <Flex w={"full"} flexDirection={"column"} gap={3}>
                                    <Skeleton h={"10px"} w={"80px"} />
                                    <Skeleton h={"8px"} w={"90%"} />
                                </Flex>
                            </Flex>
                        ))}
                    {!loadingConversations && (
                        conversations.map((conversation, index) => (
                            <Conversation
                                key={conversation._id || index}
                                isOnline={onlineUsers.includes(conversation.participants[0]._id)}
                                conversation={conversation} />
                        ))
                    )}
                </Flex>
                {!selectedConversation._id ? (
                    <Flex flex={70}
                        borderRadius={"md"}
                        p={2}
                        flexDir={"column"}
                        alignItems={"center"}
                        justifyContent={"center"}
                        height={"400px"}
                    >
                        <GiConversation size={100} />
                        <Text>Select a conversation to start messaging</Text>
                    </Flex>
                ) : (
                    <MessageContainer />
                )}


            </Flex>
        </Box>
    )
}

export default ChatPage