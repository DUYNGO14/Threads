import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Button,
} from "@chakra-ui/react";
import PropTypes from "prop-types";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
            <ModalHeader>
                Confirm delete</ModalHeader>
            <ModalCloseButton />
            <ModalBody>Are you sure you want to delete this conversation?</ModalBody>
            <ModalFooter>
                <Button mr={3} onClick={onClose}>Cancel</Button>
                <Button colorScheme="red" onClick={onConfirm}>Delete</Button>
            </ModalFooter>
        </ModalContent>
    </Modal>
);

DeleteConfirmationModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
};

export default DeleteConfirmationModal;
