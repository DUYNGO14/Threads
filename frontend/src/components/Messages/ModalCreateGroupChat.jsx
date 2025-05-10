import React, { useEffect, useState } from "react";
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, ModalFooter, Button, FormControl, FormLabel, Input,
    CheckboxGroup, Checkbox, useToast, useColorModeValue, VStack,
    Text, Avatar, Flex, Spinner
} from "@chakra-ui/react";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "@atoms/userAtom";
import api from "@services/api";
import useDebounce from "@hooks/useDebounce";
import useShowToast from "@hooks/useShowToast";
import { conversationsAtom } from "@atoms/messagesAtom";
import { useUserSearch } from "@hooks/useUserSearch";
import useMergedFollowUsers from "@hooks/useMergedFollowUsers";
const ModalCreateGroupChat = ({ isOpen, onClose }) => {
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);

    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    const [conversations, setConversations] = useRecoilState(conversationsAtom);
    const currentUser = useRecoilValue(userAtom);
    const showToast = useShowToast();
    const debouncedSearchQuery = useDebounce(searchText, 300);
    const searchResult = useUserSearch(debouncedSearchQuery);



    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedUsers.length === 0) {
            showToast("Warning", "Please select at least one user", "warning");
            return;
        }

        const participants = selectedUsers.includes(String(currentUser.id))
            ? selectedUsers
            : [...selectedUsers, String(currentUser._id)];
        try {
            const res = await api.post("/api/conversations/group", {
                groupName,
                participants,
            });
            setConversations((prev) => [res.data, ...prev]);
            showToast("Success", "Create group success", "success");
            onClose();
            setGroupName("");
            setSelectedUsers([]);
            setSearchText("");
        } catch (error) {
            console.error("Create group error:", error);
            showToast("Error", "Create group error", "error");
        }
    };
    const { mergedUsers } = useMergedFollowUsers(currentUser.username);
    const usersToRender = searchText ? searchResult : mergedUsers;
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent bg={useColorModeValue("gray.100", "gray.dark")}>
                <ModalHeader textAlign="center">Create Group</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <form onSubmit={handleSubmit}>
                        <FormControl>
                            <FormLabel>Group name</FormLabel>
                            <Input
                                placeholder="Group name"
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />

                            <FormLabel my={4}>Serach users</FormLabel>
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
                                    {loading ? (
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
                                        usersToRender.map((user) => (
                                            <Checkbox key={user._id} value={String(user._id)}>
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

                        <ModalFooter>
                            <Button
                                colorScheme="teal"
                                type="submit"
                                w="full"
                                isDisabled={selectedUsers.length === 0}
                            >
                                Tạo nhóm chat
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ModalCreateGroupChat;
