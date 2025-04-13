import { SearchIcon } from "@chakra-ui/icons";
import {
    Avatar,
    Box,
    Button,
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
    Skeleton,
    SkeletonCircle,
    Text,
    useBreakpointValue,
    useColorModeValue,
    Select,
} from "@chakra-ui/react";
import Conversation from "../components/Conversation";
import { GiConversation } from "react-icons/gi";
import MessageContainer from "../components/MessageContainer";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { useSocket } from "../context/SocketContext";

const ChatPage = () => {
    const [searchingUser, setSearchingUser] = useState(false);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
    const [conversations, setConversations] = useRecoilState(conversationsAtom);
    const currentUser = useRecoilValue(userAtom);
    const showToast = useShowToast();
    const { socket, onlineUsers } = useSocket();



    const handleDeleteConversation = (conversationId) => {
        setConversations((prev) => prev.filter(c => c._id !== conversationId));

        if (selectedConversation?._id === conversationId) {
            setSelectedConversation({});
        }
    };

    useEffect(() => {
        socket?.on("messagesSeen", ({ conversationId }) => {
            setConversations((prev) =>
                prev.map((conversation) =>
                    conversation._id === conversationId
                        ? {
                            ...conversation,
                            lastMessage: {
                                ...conversation.lastMessage,
                                seen: true,
                            },
                        }
                        : conversation
                )
            );
        });
    }, [socket, setConversations]);

    useEffect(() => {
        const getConversations = async () => {
            try {
                const res = await fetch("/api/conversations");
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

    const handleConversationSearch = async (e) => {
        e.preventDefault();
        setSearchingUser(true);
        try {
            const res = await fetch(`/api/users/search/${searchText}`);
            const users = await res.json();

            if (!Array.isArray(users) || users.length === 0) {
                setSearchResults([]);
                return;
            }

            // Lọc user khác current user
            const filteredUsers = users.filter((user) => user._id !== currentUser._id);
            setSearchResults(filteredUsers);
        } catch (error) {
            showToast("Error", error.message, "error");
        } finally {
            setSearchingUser(false);
        }
    };

    const handleSelectUser = async (user) => {
        try {
            // Gọi API tạo hoặc lấy conversation
            const res = await fetch("/api/conversations/initiate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receiverId: user._id }),
            });
            const data = await res.json();

            if (data.error) {
                showToast("Error", data.error, "error");
                return;
            }

            // Tìm participant khác currentUser
            const otherUser = data.participants.find((p) => p._id !== currentUser._id);

            // Cập nhật danh sách conversation nếu chưa có
            const exists = conversations.find((c) => c._id === data._id);
            if (!exists) {
                setConversations((prev) => [...prev, data]);
            }

            // Chọn conversation hiện tại
            setSelectedConversation({
                _id: data._id,
                userId: otherUser._id,
                username: otherUser.username,
                userProfilePic: otherUser.profilePic,
            });

            setSearchResults([]);
            setSearchText("");
        } catch (error) {
            showToast("Error", error.message, "error");
        }
    };


    useEffect(() => {
        socket?.on("updateUnreadCounts", (map) => {
            setConversations((prev) =>
                prev.map((c) => ({
                    ...c,
                    unreadCount: map[c._id] || 0,
                }))
            );
        });

        return () => {
            socket?.off("updateUnreadCounts");
        };
    }, [socket, setConversations]);

    const isMobile = useBreakpointValue({ base: true, md: false });
    const backgroundColor = useColorModeValue("gray.100", "gray.dark");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const [filter, setFilter] = useState("all");
    return (
        <Box
            position={"absolute"}
            left={"50%"}
            w={"100%"}
            p={4}
            transform={"translateX(-50%)"}
        >
            <Flex
                gap={4}
                flexDirection={"row"}
                maxW={"full"}
                mx={"auto"}
            >
                <Flex flex={20} gap={2} flexDirection={"column"} maxW={{ sm: "250px", md: "full" }} mx={"auto"}>
                    <Text fontWeight={800} fontSize={"xl"} color={useColorModeValue("gray.600", "gray.400")}>
                        Your Conversations
                    </Text>
                    <form onSubmit={handleConversationSearch}>
                        <InputGroup>
                            <InputLeftElement pointerEvents="none">
                                <SearchIcon color="gray.400" />
                            </InputLeftElement>
                            <Input
                                placeholder="Search for a user"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                bg={useColorModeValue("white", "gray.800")}
                            />
                        </InputGroup>
                    </form>


                    {searchResults.length > 0 ? (
                        <Box mt={2} borderRadius="md" p={2} bg={backgroundColor}>
                            {searchResults.map((user) => (
                                <Flex
                                    key={user._id}
                                    alignItems="center"
                                    justifyContent="space-between"
                                    p={2}
                                    borderBottom="1px solid"
                                    borderColor={borderColor}
                                >
                                    <Flex alignItems="center" gap={3}>
                                        <Avatar size="sm" name={user.name} src={user.profilePic} />
                                        <Box>
                                            <Text fontWeight="bold">{user.name}</Text>
                                            <Text fontSize="sm" color="gray.500">
                                                @{user.username}
                                            </Text>
                                        </Box>
                                    </Flex>
                                    <Button size="sm" onClick={() => handleSelectUser(user)}>
                                        Message
                                    </Button>
                                </Flex>
                            ))}
                        </Box>
                    ) : (
                        <Box mt={2} borderRadius="md" p={2} bg={backgroundColor}>
                            <Select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                size="sm"
                                variant="filled"
                                borderRadius="md"
                                focusBorderColor="blue.400"
                            >
                                <option value="visible"> Message is showing</option>
                                <option value="hidden">Message is hidden</option>
                            </Select>
                        </Box>
                    )}

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

                    {!loadingConversations &&
                        conversations.map((conversation) => {
                            const otherUser = conversation.participants.find(p => p._id !== currentUser._id);
                            const isOnline = onlineUsers.includes(otherUser._id);

                            return (
                                <Conversation
                                    key={conversation._id}
                                    isOnline={isOnline}
                                    conversation={conversation}
                                    isMobile={isMobile}
                                    onDelete={handleDeleteConversation}
                                />
                            );
                        })}

                </Flex>

                {!selectedConversation?._id && (
                    <Flex
                        flex={70}
                        borderRadius={"md"}
                        p={2}
                        flexDir={"column"}
                        alignItems={"center"}
                        justifyContent={"center"}
                        height={"400px"}
                    >
                        <GiConversation size={100} />
                        <Text fontSize={20}>Select a conversation to start messaging</Text>
                    </Flex>
                )}

                {selectedConversation?._id && (
                    <MessageContainer isOnline={onlineUsers.includes(selectedConversation.userId)} />
                )}

            </Flex>
        </Box>
    );
};

export default ChatPage;
