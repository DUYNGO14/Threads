import { Avatar, Box, Button, Divider, Flex, IconButton, Text, VStack } from '@chakra-ui/react'
import React, { useState } from 'react'
import { IoMdPersonAdd } from 'react-icons/io'
import { useRecoilValue } from 'recoil';
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

const SettingsChat = ({ settingsFlex, setShowChatSettings }) => {
    const currentUser = useRecoilValue(userAtom);
    const navigate = useNavigate();
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const [isOpenDeleteGroupModal, setIsOpenDeleteGroupModal] = useState(false);
    const [isOpenLeaveGroupModal, setIsOpenLeaveGroupModal] = useState(false);
    const [isOpenDeleteConversationModal, setIsOpenDeleteConversationModal] = useState(false);
    const [isRemoveUserModal, setIsRemoveUserModal] = useState(false);
    const [isAddUserModal, setIsAddUserModal] = useState(false);
    const [userRemove, setUserRemove] = useState();
    const handleClose = () => setShowChatSettings(false);
    return (
        <Flex
            display={{ base: "none", md: "flex" }}
            flex={settingsFlex}
            direction="column"
            w="full"
            borderLeft="1px solid"
            borderColor="gray.700"
            color="white"
            maxH="100vh" // đảm bảo không tràn viewport
        >
            <Box p={4}>
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                    Detail
                </Text>

                <Divider borderColor="gray.600" mb={4} />

                {/* Tắt thông báo */}
                {selectedConversation.isGroup && (
                    <>
                        <Flex align="center" justify="space-between" mb={4}>
                            <Button variant="ghost" size="sm" border={"1px solid"} borderColor="gray.600" borderRadius="md" p={2} onClick={() => { setIsAddUserModal(true) }}>
                                <IoMdPersonAdd />
                                <Text ml={2}>Add new user</Text>
                            </Button>
                        </Flex>
                        <Divider borderColor="gray.600" mb={4} />
                    </>
                )}

                {/* Thành viên */}
                <Text fontWeight="semibold" mb={2}>Member</Text>
            </Box>

            {/* LIST MEMBER CÓ SCROLL */}
            <Box
                flex="1"
                overflowY="auto"
                px={4}
            >
                {selectedConversation.isGroup ? (
                    <VStack align="stretch" spacing={2}>
                        {selectedConversation.participants
                            .filter((participant) => participant._id !== currentUser._id)
                            .map((participant) => (
                                <Flex
                                    key={participant._id}
                                    gap={2}
                                    p={2}
                                    cursor={"pointer"}
                                    align="center"
                                    justifyContent="space-between"
                                    width="100%"
                                >
                                    {/* Bên trái: Avatar + Username */}
                                    <Flex
                                        gap={2}
                                        align="center"
                                        onClick={() => navigate(`/user/${participant.username}`)}
                                        width="auto"
                                    >
                                        <Avatar size="md" src={participant.profilePic} />
                                        <Box>
                                            <Text
                                                fontSize="sm"
                                                color="gray.400"
                                                _hover={{ textDecoration: "underline" }}
                                            >

                                                {participant.username.length > 15 ? `${participant.username.slice(0, 20)}...` : participant.username}
                                                {participant._id === selectedConversation.groupAdmin && (
                                                    <Text as="span" color="teal.400" fontWeight="bold" ml={2}>
                                                        (Admin)
                                                    </Text>
                                                )}
                                            </Text>
                                        </Box>
                                    </Flex>

                                    {/* Bên phải: Nút remove */}
                                    {currentUser._id === selectedConversation.groupAdmin &&
                                        participant._id !== currentUser._id && (
                                            <IconButton
                                                aria-label="remove"
                                                icon={<MdOutlineGroupRemove />}
                                                colorScheme="red"
                                                size="sm"
                                                border="1px solid"
                                                borderColor="gray.600"
                                                borderRadius="md"
                                                onClick={() => {
                                                    setIsRemoveUserModal(true);
                                                    setUserRemove(participant);
                                                }}
                                            />
                                        )}
                                </Flex>
                            ))}
                    </VStack>
                ) : (
                    <Flex align="center" gap={3} p={2} cursor={"pointer"} onClick={() => navigate(`/user/${selectedConversation.username}`)}>
                        <Avatar size="md" src={selectedConversation.userProfilePic} />
                        <Box>
                            <Text fontSize="sm" color="gray.400" _hover={{ textDecoration: "underline" }}>
                                {selectedConversation.username}
                            </Text>
                        </Box>
                    </Flex>
                )}
            </Box>

            {/* PHẦN HÀNH ĐỘNG LUÔN Ở DƯỚI */}
            <Box p={4}>
                <Divider borderColor="gray.600" mb={4} />
                <VStack align="stretch" spacing={2}>
                    {selectedConversation.isGroup ? (
                        currentUser._id === selectedConversation.groupAdmin ? (
                            <Text
                                color="red.400"
                                cursor="pointer"
                                _hover={{ textDecoration: "underline" }}
                                onClick={() => setIsOpenDeleteGroupModal(true)}
                            >
                                Delete group chat
                            </Text>
                        ) : (
                            <Text
                                color="red.400"
                                cursor="pointer"
                                _hover={{ textDecoration: "underline" }}
                                onClick={() => setIsOpenLeaveGroupModal(true)}
                            >
                                Leave group chat
                            </Text>
                        )
                    ) : (
                        <Text
                            color="red.400"
                            cursor="pointer"
                            _hover={{ textDecoration: "underline" }}
                            onClick={() => setIsOpenDeleteConversationModal(true)}
                        >
                            Delete conversation
                        </Text>
                    )}
                </VStack>
            </Box>

            {/* Modals */}
            {isOpenDeleteConversationModal && <ModalDeleteConversion
                handleClose={handleClose}
                isOpen={isOpenDeleteConversationModal}
                onClose={() => setIsOpenDeleteConversationModal(false)}
            />}
            {isOpenDeleteGroupModal && <ModalDeleteGroup
                handleClose={handleClose}
                isOpen={isOpenDeleteGroupModal}
                onClose={() => setIsOpenDeleteGroupModal(false)}
            />}
            {isOpenLeaveGroupModal && <ModalLeaveGroup
                handleClose={handleClose}
                isOpen={isOpenLeaveGroupModal}
                onClose={() => setIsOpenLeaveGroupModal(false)}
            />}
            {isRemoveUserModal && <ModalRemoveUserGroup
                isOpen={isRemoveUserModal}
                onClose={() => setIsRemoveUserModal(false)}
                userRemove={userRemove}
            />}
            {isAddUserModal && <ModalAddUserToGroup
                isOpen={isAddUserModal}
                onClose={() => setIsAddUserModal(false)}
            />}
        </Flex>
    )
}

export default SettingsChat;
