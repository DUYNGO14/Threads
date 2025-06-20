import { BellIcon, SearchIcon } from "@chakra-ui/icons";
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
    FormControl,
} from "@chakra-ui/react";
import Conversation from "@components/Conversation";;
import { useEffect, useState } from "react";
import useShowToast from "@hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import { conversationsAtom, messagesAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { useSocket } from "@context/SocketContext";
import api from "../services/api.js";
import PopoverSettingChat from "../components/Popover/PopoverSettingChat.jsx";
import MessageArea from "../components/Messages/MessageArea.jsx";
import useDebounce from "@hooks/useDebounce";
import { useUserSearch } from "@hooks/useUserSearch";
import DrawerExample from "../components/Messages/DrawerSettingChat.jsx";
import { useChatSocket } from "../hooks/useChatSocket.js";
const ChatPage = () => {
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [searchText, setSearchText] = useState("");
    // const [searchResults, setSearchResults] = useState([]);
    const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
    const [conversations, setConversations] = useRecoilState(conversationsAtom);
    const currentUser = useRecoilValue(userAtom);
    const [messages, setMessages] = useRecoilState(messagesAtom);
    const showToast = useShowToast();
    const { socket, onlineUsers } = useSocket();
    const [filter, setFilter] = useState("all");
    const [followedUsers, setFollowedUsers] = useState([]);
    const [showChatSettings, setShowChatSettings] = useState(false);
    const backgroundColor = useColorModeValue("gray.100", "gray.dark");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const textColor = useColorModeValue("gray.600", "gray.400");
    const bgColor = useColorModeValue("white", "gray.800")
    const isMobile = useBreakpointValue({ base: true, md: false });
    const sidebarFlex = useBreakpointValue({ base: 100, md: 25 });
    const messageFlex = useBreakpointValue({
        base: 100,
        md: 100 - (sidebarFlex || 0),
    });
    const debouncedSearchQuery = useDebounce(searchText, 300);
    const searchResults = useUserSearch(debouncedSearchQuery);
    useChatSocket();
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
                const res = await api.get(`/api/users/${currentUser.username}/following`);
                const data = await res.data;
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
                const res = await api.get("/api/conversations");
                const data = await res.data;
                if (data.error) return showToast("Error", data.error, "error");
                setConversations(data);
            } catch (error) {
                showToast("Error", error.message, "error");
            } finally {
                setLoadingConversations(false);
            }
        };
        fetchConversations();
    }, []);

    const handleSelectUser = async (user) => {
        try {
            const res = await api.post("/api/conversations/initiate", {
                receiverId: user._id,
            });
            const data = await res.data;

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
            setSearchText("");
        } catch (error) {
            showToast("Error", error.message, "error");
        }
    };

    useEffect(() => {
        setMessages([]);
    }, [selectedConversation._id]);
    const handleClose = () => {
        setMessages([]);
        setSelectedConversation({});
        setShowChatSettings(false);
    }

    return (
        <Box w="full" h="100vh" p={4} overflowX="hidden">
            <Flex direction="row" w="full" h="90%" mx="auto" gap={4} flexWrap="nowrap">
                <Flex
                    display={(!isMobile || !selectedConversation?._id) ? "flex" : "none"}
                    flex={sidebarFlex}
                    direction="column"
                    w="full"
                    maxW={{ base: "full", md: "350px" }}
                    overflowY="auto"
                    h="full"
                >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Text fontWeight={800} fontSize="xl" color={textColor}>
                            Your Conversations
                        </Text>
                        <PopoverSettingChat />
                    </Box>
                    <FormControl>
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
                    </FormControl>
                    {conversations.length === 0 && followedUsers.length > 0 && searchResults.length === 0 && (
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
                    {searchResults.length > 0 && (
                        <Box mt={2} borderRadius="md" p={2} bg={backgroundColor}>
                            <Text fontWeight="bold">Result for {searchText}</Text>
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
                            const isOnline = onlineUsers.includes(otherUser?._id);
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

                <MessageArea
                    isMobile={isMobile}
                    messageFlex={messageFlex}
                    setShowChatSettings={setShowChatSettings}
                    showChatSettings={showChatSettings}
                    onlineUsers={onlineUsers}
                    handleClose={handleClose} />
                {showChatSettings && <DrawerExample isOpen={showChatSettings} onClose={() => setShowChatSettings(false)} />}
            </Flex>
        </Box >
    );
};

export default ChatPage;
