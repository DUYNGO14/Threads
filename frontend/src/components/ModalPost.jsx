import {
    Modal, ModalBody, ModalCloseButton, ModalContent,
    ModalOverlay, Image, Box
} from "@chakra-ui/react";

const ModalPost = ({ mediaUrl, mediaType, isOpen, onClose }) => {
    return (
        <Modal onClose={onClose} isOpen={isOpen} size="full" motionPreset="scale">
            <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(10px)" />

            <ModalContent
                bg="black"
                display="flex"
                justifyContent="center"
                alignItems="center"
                maxW="100vw"
                maxH="100vh"
                borderRadius="0"
                onClick={onClose} // Click ra ngoài để đóng
            >
                <ModalCloseButton
                    color="white"
                    _hover={{ bg: "whiteAlpha.300" }}
                    position="absolute"
                    top="20px"
                    left="20px"
                    zIndex="10"
                />

                <ModalBody
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    w="100vw"
                    h="100vh"
                    p={0}
                >
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        maxW="90vw"
                        maxH="90vh"
                        onClick={(e) => e.stopPropagation()} // Chặn click để không đóng modal
                    >
                        {mediaType === "image" ? (
                            <Image
                                src={mediaUrl}
                                alt="Post Image"
                                maxW="100%"
                                maxH="95vh"
                                objectFit="contain"
                            />
                        ) : (
                            <video
                                src={mediaUrl}
                                controls
                                autoPlay
                                playsInline
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    maxHeight: "95vh",
                                    objectFit: "contain",
                                    backgroundColor: "black",
                                }}
                            />
                        )}
                    </Box>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ModalPost;
