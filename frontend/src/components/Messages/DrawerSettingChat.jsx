import { Avatar, Box, Divider, Flex, IconButton, Text, VStack, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, useColorModeValue, Button, Tooltip, Input, } from "@chakra-ui/react"
import { useRef } from "react"
import { useState } from 'react'
import { IoMdPersonAdd } from 'react-icons/io'
import { useRecoilValue, useSetRecoilState } from 'recoil';
import userAtom from '@atoms/userAtom';
import { useNavigate } from 'react-router-dom';
import { selectedConversationAtom } from '@atoms/messagesAtom';
import { MdOutlineGroupRemove } from "react-icons/md";
import useShowToast from '@hooks/useShowToast';
import ModalDeleteGroup from './ModalDeleteGroup';
import ModalLeaveGroup from './ModalLeaveGroup';
import ModalDeleteConversion from './ModalDeleteConversion';
import ModalRemoveUserGroup from './ModalRemoveUserGroup';
import ModalAddUserToGroup from './ModalAddUserToGroup';
import api from "../../services/api";
import { conversationsAtom } from "../../atoms/messagesAtom";
function DrawerExample({ isOpen, onClose }) {

    const btnRef = useRef()
    const currentUser = useRecoilValue(userAtom);
    const navigate = useNavigate();
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const [isOpenDeleteGroupModal, setIsOpenDeleteGroupModal] = useState(false);
    const [isOpenLeaveGroupModal, setIsOpenLeaveGroupModal] = useState(false);
    const [isOpenDeleteConversationModal, setIsOpenDeleteConversationModal] = useState(false);
    const [isRemoveUserModal, setIsRemoveUserModal] = useState(false);
    const [isAddUserModal, setIsAddUserModal] = useState(false);
    const [userRemove, setUserRemove] = useState();
    const [isEditingName, setIsEditingName] = useState(false);
    const [groupName, setGroupName] = useState(selectedConversation.groupName || "");
    const setSelectedConversation = useSetRecoilState(selectedConversationAtom);
    const setConversations = useSetRecoilState(conversationsAtom);
    const showToast = useShowToast();
    const initNameGroup = selectedConversation.groupName;
    const handleSaveGroupName = async () => {
        if (!groupName.trim() || initNameGroup === groupName.trim()) return;

        try {
            const res = await api.put(`/api/conversations/${selectedConversation._id}/rename`, {
                name: groupName.trim(),
            });
            if (res.status !== 200) throw new Error("Something went wrong")
            setSelectedConversation(prev => ({
                ...prev,
                groupName: groupName,
            }));
            setConversations(prev => {
                const newConversations = prev.map(conversation => {
                    if (conversation._id === selectedConversation._id) {
                        return {
                            ...conversation,
                            groupName: groupName,
                        };
                    }
                    return conversation;
                });
                return newConversations;
            });
            setIsEditingName(false);
        } catch (error) {
            showToast("", "Something went wrong", "error")
        }
    };
    return (
        <>
            <Drawer
                isOpen={isOpen}
                placement='right'
                onClose={onClose}
                finalFocusRef={btnRef}

            >
                <DrawerOverlay />
                <DrawerContent bg={useColorModeValue('gray.100', 'gray.dark')} >
                    {/* <DrawerCloseButton /> */}
                    <DrawerHeader>
                        {selectedConversation.isGroup ? (
                            isEditingName ? (
                                <Flex gap={2} align="center">
                                    <Input
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        size="sm"
                                        maxW="250px"
                                    />
                                    <Button size="sm" colorScheme="teal" onClick={handleSaveGroupName}>
                                        Save
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => {
                                        setIsEditingName(false);
                                        setGroupName(selectedConversation.name);
                                    }}>
                                        Cancel
                                    </Button>
                                </Flex>
                            ) : (
                                <Flex justify="space-between" align="center">
                                    <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.600', 'gray.200')}>
                                        {selectedConversation.groupName.length > 20 ? `${selectedConversation.groupName.slice(0, 20)}...` : selectedConversation.groupName}
                                    </Text>
                                    {currentUser._id === selectedConversation.groupAdmin && (<Button size="sm" variant="ghost" colorScheme="teal" onClick={() => setIsEditingName(true)}>
                                        Rename
                                    </Button>)}

                                </Flex>
                            )
                        ) : (
                            <Text fontSize="lg" fontWeight="bold">
                                {selectedConversation.isGroup ? selectedConversation.name : 'Conversation Details'}
                            </Text>
                        )}
                    </DrawerHeader>

                    <DrawerBody p={4}>
                        <Flex direction="column" height="100%">
                            <Box flex="1" overflowY="auto">
                                <Divider borderColor="gray.600" mb={4} />
                                {selectedConversation.isGroup && currentUser._id === selectedConversation.groupAdmin && (
                                    <Box>
                                        <Flex align="center" justify="flex-start" mb={4}>
                                            <Tooltip label="Add new user">
                                                <IconButton
                                                    icon={<IoMdPersonAdd />}
                                                    aria-label="Add new user"
                                                    size="sm"
                                                    variant="outline"
                                                    colorScheme="teal"
                                                    onClick={() => setIsAddUserModal(true)}
                                                />
                                            </Tooltip>
                                            <Text ml={2} fontSize="sm">Add new user</Text>
                                        </Flex>

                                        <Divider borderColor="gray.600" mb={4} />
                                    </Box>
                                )}

                                {/* Thành viên */}
                                <Text fontWeight="semibold" mb={2}>Member</Text>

                                {/* LIST MEMBER CÓ SCROLL */}
                                <Box maxH="300px" overflowY="auto" pr={1}>
                                    {selectedConversation.isGroup ? (
                                        <VStack align="stretch" spacing={2}>
                                            {selectedConversation.participants
                                                .filter((participant) => participant._id !== currentUser._id)
                                                .map((participant) => (
                                                    <Flex
                                                        key={participant._id}
                                                        gap={2}
                                                        p={2}
                                                        align="center"
                                                        justifyContent="space-between"
                                                        _hover={{ bg: useColorModeValue('gray.200', 'gray.700') }}
                                                        borderRadius="md"
                                                    >
                                                        {/* Bên trái: Avatar + Username */}
                                                        <Flex
                                                            gap={2}
                                                            align="center"
                                                            cursor="pointer"
                                                            onClick={() => navigate(`/user/${participant.username}`)}
                                                            flex="1"
                                                        >
                                                            <Avatar size="md" src={participant.profilePic} />
                                                            <Text
                                                                fontSize="sm" color="gray.200"
                                                                _hover={{ textDecoration: "underline" }}
                                                            >

                                                                {participant.username.length > 20 ? `${participant.username.slice(0, 20)}...` : participant.username}
                                                                {participant._id === selectedConversation.groupAdmin && (
                                                                    <Text as="span" color="teal.400" fontWeight="bold" ml={2}>
                                                                        (Admin)
                                                                    </Text>
                                                                )}
                                                            </Text>
                                                        </Flex>

                                                        {/* Bên phải: Nút remove */}
                                                        {currentUser._id === selectedConversation.groupAdmin &&
                                                            participant._id !== currentUser._id && (
                                                                <Tooltip label="Remove user">
                                                                    <IconButton
                                                                        aria-label="remove"
                                                                        icon={<MdOutlineGroupRemove />}
                                                                        colorScheme="red"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            setIsRemoveUserModal(true);
                                                                            setUserRemove(participant);
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            )}
                                                    </Flex>
                                                ))}
                                        </VStack>
                                    ) : (
                                        <Flex align="center"
                                            gap={3}
                                            p={2}
                                            cursor="pointer"
                                            onClick={() => navigate(`/user/${selectedConversation.username}`)}>
                                            <Avatar size="md" src={selectedConversation.userProfilePic} />
                                            <Text fontSize="sm" color="gray.400" _hover={{ textDecoration: "underline" }}>
                                                {selectedConversation.username}
                                            </Text>
                                        </Flex>
                                    )}
                                </Box>
                            </Box>
                            {/* Action buttons */}
                            <Box mt={4}>
                                <Divider borderColor="gray.600" mb={4} />

                                {selectedConversation.isGroup ? (
                                    currentUser._id === selectedConversation.groupAdmin ? (
                                        <>
                                            <Button
                                                colorScheme="red"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsOpenDeleteGroupModal(true)}
                                            >
                                                Delete group chat
                                            </Button>
                                            <Button
                                                colorScheme="red"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsOpenDeleteConversationModal(true)}
                                            >
                                                Delete conversation
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                colorScheme="red"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsOpenLeaveGroupModal(true)}
                                            >
                                                Leave group chat
                                            </Button>
                                            <Button
                                                colorScheme="red"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsOpenDeleteConversationModal(true)}
                                            >
                                                Delete conversation
                                            </Button>
                                        </>
                                    )
                                ) : (
                                    <Button
                                        colorScheme="red"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsOpenDeleteConversationModal(true)}
                                    >
                                        Delete conversation
                                    </Button>
                                )}
                            </Box>
                        </Flex>
                    </DrawerBody>

                </DrawerContent>
            </Drawer >
            {/* Modals */}
            {
                isOpenDeleteConversationModal && <ModalDeleteConversion
                    handleClose={onClose}
                    isOpen={isOpenDeleteConversationModal}
                    onClose={() => setIsOpenDeleteConversationModal(false)}
                />
            }
            {
                isOpenDeleteGroupModal && <ModalDeleteGroup
                    handleClose={onClose}
                    isOpen={isOpenDeleteGroupModal}
                    onClose={() => setIsOpenDeleteGroupModal(false)}
                />
            }
            {
                isOpenLeaveGroupModal && <ModalLeaveGroup
                    handleClose={onClose}
                    isOpen={isOpenLeaveGroupModal}
                    onClose={() => setIsOpenLeaveGroupModal(false)}
                />
            }
            {
                isRemoveUserModal && <ModalRemoveUserGroup
                    isOpen={isRemoveUserModal}
                    onClose={() => setIsRemoveUserModal(false)}
                    userRemove={userRemove}
                />
            }
            {
                isAddUserModal && <ModalAddUserToGroup
                    isOpen={isAddUserModal}
                    onClose={() => setIsAddUserModal(false)}
                />
            }
        </>
    )
}

export default DrawerExample