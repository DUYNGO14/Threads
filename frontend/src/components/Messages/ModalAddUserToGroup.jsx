import { useRecoilState, useRecoilValue } from "recoil";
import BaseModal from "../Modal/BaseModal";
import {
    Avatar,
    Button,
    Checkbox,
    CheckboxGroup,
    Flex,
    FormControl,
    FormLabel,
    Input,
    Spinner,
    Text,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { followersAtom, followingAtom } from "@atoms/followAtoms";
import { selectedConversationAtom } from "@atoms/messagesAtom";
import useDebounce from "@hooks/useDebounce";
import api from "@services/api";
import useShowToast from "@hooks/useShowToast";
import useSettingChatPage from "@hooks/useSettingChatPage";
import { useUserSearch } from "@hooks/useUserSearch";
import useMergedFollowUsers from "@hooks/useMergedFollowUsers";
const ModalAddUserToGroup = ({ isOpen, onClose }) => {
    const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
    const { handleAddMembersToGroup, loading } = useSettingChatPage();
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const debouncedSearchQuery = useDebounce(searchText, 300);
    const searchResult = useUserSearch(debouncedSearchQuery);
    const showToast = useShowToast();

    const existingUserIds = new Set(selectedConversation.participants.map((u) => u._id));
    const { mergedUsers } = useMergedFollowUsers();

    const uniqueUsers = mergedUsers.filter(
        (user, index, self) =>
            !existingUserIds.has(user._id) &&
            index === self.findIndex((u) => u._id === user._id)
    );
    const filteredSearchResult = searchResult.filter((user) => !existingUserIds.has(user._id));
    const usersToRender = searchText ? filteredSearchResult : uniqueUsers;
    useEffect(() => {
        if (!isOpen) {
            // Reset khi modal đóng
            setSelectedUsers([]);
            setSearchText("");

        }
    }, [isOpen]);
    const handleAddUser = async () => {
        const newUserIds = selectedUsers.filter((userId) => !existingUserIds.has(userId));

        if (newUserIds.length === 0) {
            showToast("Info", "Select users to add.", "info");
            return;
        }

        const res = await handleAddMembersToGroup(selectedConversation, newUserIds);

        if (res.error) {
            console.error(res.error);
            showToast("Error", res.error, "error");
            return;
        }

        if (res.data?.conversation) {
            setSelectedConversation(res.data.conversation);
            onClose();
            showToast("Success", "Add members successfully", "success");
        }

    };

    const footer = (
        <Button onClick={handleAddUser} mr={3} colorScheme="blue" isLoading={loading}>
            Add
        </Button>
    );

    const title = `Add User To Group ${selectedConversation.groupName}`;

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
            <FormControl>
                <FormLabel my={4}>Search users</FormLabel>
                <Input
                    placeholder="Search users"
                    borderRadius="full"
                    bg={useColorModeValue("white", "gray.dark")}
                    onChange={(e) => setSearchText(e.target.value)}
                    value={searchText}
                    fontSize={{ base: "sm", md: "md" }}
                    py={{ base: 2, md: 3 }}
                    mb={4}
                />

                <Text fontSize="sm" color="gray.500" mb={2}>
                    Selected: {selectedUsers.length} users
                </Text>
                <FormLabel my={4}>Suggest users</FormLabel>
                <CheckboxGroup
                    colorScheme="teal"
                    value={selectedUsers.map(String)}
                    onChange={(values) => setSelectedUsers(values)}
                >
                    <VStack align="start" maxH="250px" overflowY="auto">
                        {isLoading ? (
                            <Flex w="full" justify="center" py={4}>
                                <Spinner size="sm" />
                            </Flex>
                        ) : usersToRender.length === 0 ? (
                            <Text textAlign="center" color="gray.500">
                                {searchText
                                    ? "Không tìm thấy người dùng phù hợp."
                                    : "Không có người gợi ý."}
                            </Text>
                        ) : (
                            usersToRender.map((user, index) => (
                                <Checkbox key={index} value={String(user._id)}>
                                    <Flex alignItems="center" gap={2}>
                                        <Avatar size="xs" name={user.username} src={user.profilePic} />
                                        <Text>{user.username}</Text>
                                    </Flex>
                                </Checkbox>
                            ))
                        )}
                    </VStack>
                </CheckboxGroup>
            </FormControl>
        </BaseModal>
    );
};

export default ModalAddUserToGroup;
