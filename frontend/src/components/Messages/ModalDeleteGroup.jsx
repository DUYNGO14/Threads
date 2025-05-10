import BaseModal from "@components/Modal/BaseModal";
import { Button, Text } from '@chakra-ui/react';
import useSettingChatPage from '@/hooks/useSettingChatPage';
import useShowToast from '@hooks/useShowToast';
import { useRecoilValue } from 'recoil';
import { selectedConversationAtom } from '../../atoms/messagesAtom';
const ModalDeleteGroup = ({ isOpen, onClose, handleClose }) => {
    const { handleDeleteGroup, onUpdateDeleteConversation, loading } = useSettingChatPage();
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const showToast = useShowToast();
    const handleDelete = async () => {
        const res = await handleDeleteGroup(selectedConversation);
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
            <Button onClick={handleDelete} colorScheme="blue" isLoading={loading}>
                YES
            </Button>
        </>
    );
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Delete Group Chat" footer={footer}>
            <Text align="center">Are you sure you want to delete this group chat <br></br> {selectedConversation.groupName}?</Text>
        </BaseModal>
    )
}
export default ModalDeleteGroup