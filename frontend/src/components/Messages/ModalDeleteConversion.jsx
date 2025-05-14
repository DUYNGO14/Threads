import {
    Avatar,
    Box,
    Button,
    Text,
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import BaseModal from "../Modal/BaseModal";
import useSettingChatPage from '@/hooks/useSettingChatPage';
import useShowToast from '@hooks/useShowToast';
import { useRecoilValue } from "recoil";
import { selectedConversationAtom } from "../../atoms/messagesAtom";
const footer = (
    <Button colorScheme="red" mr={3}>
        Delete
    </Button>
);
const ModalDeleteConversion = ({ isOpen, onClose, handleClose }) => {
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const { handleDeleteConversation, onUpdateDeleteConversation, loading } = useSettingChatPage();
    const showToast = useShowToast();
    const handleDelete = async () => {
        const res = await handleDeleteConversation(selectedConversation);
        console.log(res);
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
        <BaseModal isOpen={isOpen} onClose={onClose} title="Delete Conversation" footer={footer}>
            <Box>
                <Text align="center">Are you sure you want to delete this conversation with </Text>
                <Box display={"flex"} alignItems={"center"} justifyContent={"center"} gap={2} >
                    <Avatar size="md" name={selectedConversation.username || selectedConversation.groupName} src={selectedConversation.userProfilePic} />
                    <Text align="center">{selectedConversation.username || selectedConversation.groupName}</Text>
                </Box>
            </Box>

        </BaseModal>
    );
}

ModalDeleteConversion.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    selectedConversation: PropTypes.object.isRequired,
};

export default ModalDeleteConversion;
