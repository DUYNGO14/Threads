import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    ModalCloseButton,
    Box,
    Image,
} from "@chakra-ui/react";
import "./styles/modalStyles.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectFade, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { useEffect, useRef } from "react";
import AudioPlayer from "./AudioPlayer";

const ModalPost = ({ medias, initialIndex, isOpen, onClose }) => {
    const videoRefs = useRef([]);

    useEffect(() => {
        if (isOpen) {
            document.querySelectorAll("audio").forEach((audio) => audio.pause());
        } else {
            videoRefs.current.forEach((video) => video?.pause());
        }
    }, [isOpen]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onOverlayClick={onClose}
            size="full"
            motionPreset="fade"
        >
            <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(10px)" />

            <ModalContent
                bg="transparent"
                boxShadow="none"
                overflow="hidden"
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: "0",
                    w: "100vw",
                    h: "100vh",
                }}
            >
                <ModalCloseButton
                    color="white"
                    _hover={{ bg: "whiteAlpha.300" }}
                    top="20px"
                    left="20px"
                    zIndex="10"
                />

                <ModalBody
                    p={0}
                    w="100%"
                    h="100%"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    overflow="hidden"
                >
                    <Swiper
                        modules={[Navigation, Pagination, EffectFade]}
                        navigation
                        pagination={{ clickable: true }}
                        effect="fade"
                        fadeEffect={{ crossFade: true }}
                        initialSlide={initialIndex}
                        slidesPerView={1}
                        style={{ width: "100%", height: "100%" }}
                        onSlideChange={() => {
                            videoRefs.current.forEach((video) => video?.pause());
                            document.querySelectorAll("audio").forEach((audio) => audio.pause());
                        }}
                        className="mySwiper"
                    >
                        {medias.map((media, idx) => (
                            <SwiperSlide key={idx}>
                                <Box
                                    mW="100%"
                                    h="100%"
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {media.type === "image" ? (
                                        <Image
                                            src={media.url}
                                            alt={`Post Image ${idx}`}
                                            maxW="90%"
                                            maxH="100%"
                                            objectFit="contain"
                                            loading="lazy"
                                            sx={{
                                                transition: "transform 0.3s",
                                            }}
                                        />
                                    ) : media.type === "video" ? (
                                        <video
                                            ref={(el) => (videoRefs.current[idx] = el)}
                                            src={media.url}
                                            controls
                                            autoPlay
                                            playsInline
                                            muted
                                            style={{
                                                maxWidth: "90%",
                                                maxHeight: "100%",
                                                objectFit: "contain",
                                                backgroundColor: "black",
                                            }}
                                        />
                                    ) : (
                                        <AudioPlayer url={media.url} />
                                    )}
                                </Box>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ModalPost;
