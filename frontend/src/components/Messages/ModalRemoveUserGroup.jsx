import React, { useState } from 'react'
import BaseModal from "@components/Modal/BaseModal";
import { Avatar, Box, Button, Text } from '@chakra-ui/react';
import useSettingChatPage from '@hooks/useSettingChatPage';
import useShowToast from '@hooks/useShowToast';
import { useRecoilState, useRecoilValue } from 'recoil';
import { selectedConversationAtom } from '../../atoms/messagesAtom';
const ModalRemoveUserGroup = ({ isOpen, onClose, userRemove }) => {
    const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
    const { handleRemoveMembersFromGroup, loading } = useSettingChatPage();
    console.log(selectedConversation);
    const showToast = useShowToast();
    const handleRemoveUser = async () => {
        const res = await handleRemoveMembersFromGroup(selectedConversation, userRemove._id);
        if (res.error) {
            console.error(res.error);
            showToast("Error", res.error, "error");
            return;
        }
        setSelectedConversation(
            {
                ...selectedConversation,
                participants: selectedConversation.participants.filter((participant) => participant._id.toString() !== userRemove._id.toString())
            }
        );

        onClose();
        showToast("Success", "Leave group success", "success");
    }
    const footer = (
        <>
            <Button onClick={handleRemoveUser} colorScheme="blue" isLoading={loading}>
                Submit
            </Button>
        </>
    );
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Remove User From Group" footer={footer}>
            <Text align="center">Are you sure you want to remove this user from group chat {selectedConversation.groupName}?</Text>
            <Box display={"flex"} alignItems={"center"} justifyContent={"center"} gap={2} >
                <Avatar size="xs" name={userRemove.username} src={userRemove.profilePic} />
                <Text align="center">{userRemove.username}</Text>
            </Box>
        </BaseModal>
    )
}

export default ModalRemoveUserGroup