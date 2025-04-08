import {
    Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalCloseButton, ModalBody, ModalFooter, Button
} from "@chakra-ui/react";
import { useState } from "react";
import useShowToast from "../../hooks/useShowToast";
import PropTypes from "prop-types";
import useReply from "../../hooks/useReply";

const DeleteReplyModal = ({ isOpen, onClose, replyId, onSuccess, postId }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const showToast = useShowToast();

    // Lấy hàm deleteReply từ hook useReply
    const { loading, deleteReply } = useReply(postId, (deletedReply) => {
        // Callback sau khi reply bị xóa thành công
        onSuccess(deletedReply); // Gọi onSuccess để cập nhật UI
        onClose(); // Đóng modal
    });

    // Hàm xử lý xóa reply
    const handleDelete = async () => {
        setIsDeleting(true);
        // Gọi hàm deleteReply từ hook để xóa reply
        await deleteReply(replyId, postId);
        setIsDeleting(false); // Reset trạng thái deleting
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Xoá bình luận?</ModalHeader>
                <ModalCloseButton />
                <ModalBody>Bạn có chắc muốn xoá bình luận này?</ModalBody>
                <ModalFooter>
                    <Button onClick={onClose} mr={3}>Huỷ</Button>
                    <Button
                        colorScheme="red"
                        isLoading={isDeleting || loading} // Khi đang xóa hoặc load dữ liệu
                        onClick={handleDelete}
                    >
                        Xoá
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

DeleteReplyModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    replyId: PropTypes.string.isRequired,
    onSuccess: PropTypes.func.isRequired,
    postId: PropTypes.string.isRequired,
};

export default DeleteReplyModal;
