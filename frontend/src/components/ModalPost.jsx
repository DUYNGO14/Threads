import {
    Modal, ModalBody, ModalCloseButton, ModalContent,
    ModalOverlay, Image, Box
} from "@chakra-ui/react";
import AudioPlayer from "./AudioPlayer";
import { useEffect, useRef, useState } from "react";

const ModalPost = ({ mediaUrl, mediaType, isOpen, onClose }) => {
    const videoRef = useRef(null);
    const imgRef = useRef(null);

    // Dừng tất cả âm thanh khi mở modal
    useEffect(() => {
        if (isOpen) {
            document.querySelectorAll('audio').forEach(audio => audio.pause());
        } else {
            // Dừng video khi đóng modal
            if (videoRef.current) videoRef.current.pause();
        }
    }, [isOpen]);

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
                                ref={imgRef}
                                src={mediaUrl}
                                alt="Post Image"
                                maxW="100%"
                                maxH="100vh"
                                objectFit="contain"
                                transition="transform 0.2s ease-out"
                            />
                        ) : mediaType === "video" ? (
                            <video
                                ref={videoRef}
                                src={mediaUrl}
                                controls
                                autoPlay
                                playsInline
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    maxHeight: "100vh",
                                    objectFit: "contain",
                                    backgroundColor: "black",
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <AudioPlayer url={mediaUrl} />
                        )}
                    </Box>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ModalPost;
