import BaseModal from "@components/Modal/BaseModal";
import { Button, Text } from '@chakra-ui/react';
import useSettingChatPage from '@/hooks/useSettingChatPage';
import useShowToast from '@hooks/useShowToast';
import { useRecoilValue } from 'recoil';
import { selectedConversationAtom } from '../../atoms/messagesAtom';

const ModalLeaveGroup = ({ isOpen, onClose, handleClose }) => {
    const { handleLeaveGroup, onUpdateDeleteConversation, loading } = useSettingChatPage();
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const showToast = useShowToast();
    const handleLeave = async () => {
        const res = await handleLeaveGroup(selectedConversation);
        if (res.error) {
            console.error(res.error);
            showToast("Error", res.error, "error");
            return;
        }
        onUpdateDeleteConversation(selectedConversation._id);
        handleClose();
        onClose();
        showToast("Success", res.data?.message, "success");
    };
    const footer = (
        <>
            <Button onClick={handleLeave} colorScheme="blue" isLoading={loading}>
                YES
            </Button>
        </>
    );
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Leave Group Chat" footer={footer}>
            <Text align="center">Are you sure you want to leave this group chat <br></br> {selectedConversation.groupName}?</Text>
        </BaseModal>
    )
}

export default ModalLeaveGroup
