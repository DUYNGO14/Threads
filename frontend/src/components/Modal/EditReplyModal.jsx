import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, FormControl, Input, ModalCloseButton, useColorModeValue, Divider } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import useReply from "@hooks/useReply";
import useShowToast from "@hooks/useShowToast";

const EditReplyModal = ({ isOpen, onClose, postId, replyId, initialText, onSuccess, isSaving }) => {
    const showToast = useShowToast();
    const [reply, setReply] = useState(initialText);
    const { loading, editReply } = useReply(postId, (updatedReply) => {
        onSuccess(updatedReply); // Gọi hàm callback sau khi chỉnh sửa thành công
        setReply(""); // Xóa dữ liệu trong modal
        onClose(); // Đóng modal
    });

    useEffect(() => {
        setReply(initialText); // Đảm bảo rằng modal nhận đúng nội dung ban đầu
    }, [initialText]);

    const handleSubmit = () => {
        // Chỉ gọi API nếu reply có thay đổi
        if (!reply.trim() || reply.trim() === initialText.trim()) {
            return showToast("Error", "Reply cannot be empty", "error");
        };

        editReply(replyId, reply); // Gọi API cập nhật
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent bg={useColorModeValue('gray.100', 'gray.dark')}>
                <ModalHeader textAlign="center">Edit Reply</ModalHeader>
                <Divider maxW={'90%'} mx={'auto'} />
                <ModalCloseButton />
                <ModalBody>
                    <FormControl>
                        <Input
                            placeholder="Edit your reply..."
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                        />
                    </FormControl>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={handleSubmit} isLoading={loading || isSaving} colorScheme="blue" mr={3}>
                        Update
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

EditReplyModal.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    postId: PropTypes.string.isRequired,
    replyId: PropTypes.string.isRequired,
    initialText: PropTypes.string.isRequired,
    onSuccess: PropTypes.func.isRequired,
    isSaving: PropTypes.bool,
};

export default EditReplyModal;
