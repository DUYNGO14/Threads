import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
    ModalFooter, ModalCloseButton, Divider, useColorModeValue
} from "@chakra-ui/react";

const BaseModal = ({ isOpen, onClose, title, children, footer }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
            <ModalOverlay backdropFilter="blur(10px)" />
            <ModalContent bg={useColorModeValue('gray.100', 'gray.dark')}>
                <ModalHeader fontSize="xl" fontWeight="bold" textAlign="center">
                    {title}
                </ModalHeader>
                <Divider maxWidth={"90%"} mx={"auto"} />
                <ModalCloseButton />
                <ModalBody>
                    {children}
                </ModalBody>
                {footer && <ModalFooter>{footer}</ModalFooter>}
            </ModalContent>
        </Modal>
    );
};

export default BaseModal;
