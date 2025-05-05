import React from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
} from '@chakra-ui/react';
import SocialProfileWithImage from '@components-admin/SocialProfileWithImage';

const UserDetailModal = ({ isOpen, onClose, user }) => {
    if (!user) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader textAlign="center">User Details</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <SocialProfileWithImage user={user} />
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default UserDetailModal;
