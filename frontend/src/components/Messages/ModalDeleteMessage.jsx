import BaseModal from "@components/Modal/BaseModal";
import { Button, Text } from '@chakra-ui/react';
import { useMessageActions } from "@hooks/useMessageActions";
import useShowToast from "@hooks/useShowToast";
import { useRecoilState } from "recoil";
import { messagesAtom } from "@atoms/messagesAtom";
const ModalDeleteMessage = ({ isOpen, onClose, message }) => {
    const { deleteMessage, isLoading } = useMessageActions();
    const showToast = useShowToast();
    const [selectMessage, setSelectedMessage] = useRecoilState(messagesAtom)
    const handleDelete = async () => {
        const res = await deleteMessage(message);
        if (res.error) {
            showToast("Error", res.data?.error, "error");
            return;
        }
        setSelectedMessage((prevMessages) =>
            prevMessages.filter((msg) => msg._id !== message._id)
        );

        onClose();
    }
    const footer = (
        <Button colorScheme="red" mr={3} onClick={handleDelete} isLoading={isLoading}>
            Delete
        </Button>
    );
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Delete Message" footer={footer}>
            <Text align="center">Are you sure you want to delete this message</Text>
        </BaseModal>
    )
}

export default ModalDeleteMessage