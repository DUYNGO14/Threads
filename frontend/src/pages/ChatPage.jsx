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
import { GiConversation } from "react-icons/gi";
import Conversation from "../components/Conversation";
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
    const [filter, setFilter] = useState("all");
    const [followedUsers, setFollowedUsers] = useState([]);

    const isMobile = useBreakpointValue({ base: true, md: false });
    const backgroundColor = useColorModeValue("gray.100", "gray.dark");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const textColor = useColorModeValue("gray.600", "gray.400");
    const bgColor = useColorModeValue("white", "gray.800")
    console.log(followedUsers)
    // Khi xóa hội thoại
    const handleDeleteConversation = (conversationId) => {
        setConversations((prev) => prev.filter(c => c._id !== conversationId));
        if (selectedConversation?._id === conversationId) {
            setSelectedConversation({});
        }
    };
    useEffect(() => {
        const fetchFollowedUsers = async () => {
            try {
                const res = await fetch(`api/users/${currentUser.username}/following`);
                const data = await res.json();
                if (data.error) return showToast("Error", data.error, "error");
                setFollowedUsers(data);
            } catch (error) {
                showToast("Error", error.message, "error");
            }
        };

        fetchFollowedUsers();
    }, []);

    // Lấy danh sách cuộc trò chuyện
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await fetch("/api/conversations");
                const data = await res.json();
                if (data.error) return showToast("Error", data.error, "error");
                setConversations(data);
            } catch (error) {
                showToast("Error", error.message, "error");
            } finally {
                setLoadingConversations(false);
            }
        };
        fetchConversations();
    }, [showToast]);

    // Tìm kiếm người dùng
    const handleConversationSearch = async (e) => {
        e.preventDefault();
        setSearchingUser(true);
        try {
            const res = await fetch(`/api/users/search/${searchText}`);
            const users = await res.json();
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

            const otherUser = data.participants.find(p => p._id !== currentUser._id);
            if (!conversations.find(c => c._id === data._id)) {
                setConversations((prev) => [...prev, data]);
            }

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

    // Cập nhật tin nhắn đã xem
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
    }, [socket]);

    // Cập nhật số lượng tin nhắn chưa đọc
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
    }, [socket]);
    const handleClose = () => {
        setSelectedConversation({});
    }
    return (
        <Box w="full" minH="100vh" p={4} overflowX="hidden">
            <Flex
                direction="row"
                w="full"
                maxW="1200px"
                mx="auto"
                gap={4}
            >
                {/* Sidebar: Your Conversations */}
                {(!isMobile || !selectedConversation?._id) && (
                    <Flex flex={30} direction="column" w="full" maxW="350px">
                        <Text fontWeight={800} fontSize="xl" color={textColor}>
                            Your Conversations
                        </Text>

                        <form onSubmit={handleConversationSearch}>
                            <InputGroup mt={2}>
                                <InputLeftElement pointerEvents="none">
                                    <SearchIcon color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Search for a user"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    bg={bgColor}
                                />
                            </InputGroup>
                        </form>
                        {conversations.length === 0 && followedUsers.length > 0 && (
                            <Box mt={2} borderRadius="md" p={2} bg={backgroundColor}>
                                <Text fontWeight="bold">People you follow</Text>
                                {followedUsers.map((user) => (
                                    <Flex
                                        key={user._id}
                                        alignItems="center"
                                        justifyContent="space-between"
                                        p={2}
                                        borderBottom="1px solid"
                                        borderColor={borderColor}
                                    >
                                        <Flex alignItems="center" gap={3}>
                                            <Avatar size="sm" src={user.profilePic} />
                                            <Box>
                                                <Text fontWeight="bold">{user.name}</Text>
                                                <Text fontSize="sm" color="gray.500">@{user.username}</Text>
                                            </Box>
                                        </Flex>
                                        <Button size="sm" onClick={() => handleSelectUser(user)}>Message</Button>
                                    </Flex>
                                ))}
                            </Box>
                        )}
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
                                            <Avatar size="sm" src={user.profilePic} />
                                            <Box>
                                                <Text fontWeight="bold">{user.name}</Text>
                                                <Text fontSize="sm" color="gray.500">@{user.username}</Text>
                                            </Box>
                                        </Flex>
                                        <Button size="sm" onClick={() => handleSelectUser(user)}>Message</Button>
                                    </Flex>
                                ))}
                            </Box>
                        ) : (
                            <Box mt={2}>
                                <Select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    size="sm"
                                    variant="filled"
                                    borderRadius="md"
                                    focusBorderColor="blue.400"
                                >
                                    <option value="visible">Message is showing</option>
                                    <option value="hidden">Message is hidden</option>
                                </Select>
                            </Box>
                        )}

                        {loadingConversations &&
                            Array(5).fill(0).map((_, i) => (
                                <Flex key={i} gap={4} align="center" p={1} borderRadius="md">
                                    <SkeletonCircle size="10" />
                                    <Flex w="full" direction="column" gap={2}>
                                        <Skeleton h="10px" w="80px" />
                                        <Skeleton h="8px" w="90%" />
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
                )}

                {/* Message Container */}
                {(!isMobile || selectedConversation?._id) && (
                    <Flex flex={70} w="full">
                        {selectedConversation?._id ? (
                            <MessageContainer isOnline={onlineUsers.includes(selectedConversation.userId)} onClose={handleClose} />
                        ) : (
                            <Flex
                                borderRadius="md"
                                p={4}
                                w="full"
                                align="center"
                                justify="center"
                                direction="column"
                                minH="300px"
                            >
                                <GiConversation size={100} />
                                <Text fontSize={20}>Select a conversation to start messaging</Text>
                            </Flex>
                        )}
                    </Flex>
                )}
            </Flex>
        </Box>
    );
};

export default ChatPage;
