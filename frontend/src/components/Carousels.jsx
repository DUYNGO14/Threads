import { Box, Image, useBreakpointValue } from "@chakra-ui/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useState, useRef, useEffect } from "react";
import ModalPost from "./ModalPost";
import AudioPlayer from "./AudioPlayer";

const Carousels = ({ medias }) => {
    const [selectedMedia, setSelectedMedia] = useState(null);
    const videoRefs = useRef([]);
    const swiperRef = useRef(null);

    const maxHeight = useBreakpointValue({ base: "60vh", md: "70vh", lg: "80vh" });

    useEffect(() => {
        if (!videoRefs.current.length) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const video = entry.target;
                    if (entry.isIntersecting) video.play();
                    else video.pause();
                });
            },
            { threshold: 0.8 }
        );
        videoRefs.current.forEach((video) => video && observer.observe(video));
        return () => {
            videoRefs.current.forEach((video) => video && observer.unobserve(video));
        };
    }, [medias]);

    return (
        <Box position="relative" overflow="hidden" w="100%">
            <Swiper
                modules={[Pagination]}
                pagination={medias.length > 1 ? { clickable: true, dynamicBullets: true } : false}
                spaceBetween={10}
                slidesPerView={"auto"}
                centeredSlides={false}
                onSwiper={(swiper) => (swiperRef.current = swiper)}
                onSlideChange={() => {
                    document.querySelectorAll("audio").forEach((audio) => audio.pause());
                }}
                style={{
                    width: "100%",
                    paddingBottom: medias.length > 1 ? "8px" : "0",
                    display: "flex",
                    justifyContent: "flex-start",
                }}
            >
                {medias.map((media, index) => (
                    <SwiperSlide key={index} style={{ width: "auto", maxWidth: "100%" }}>
                        <Box
                            cursor="pointer"
                            maxW="100%"
                            maxH="90vh"
                            overflow="hidden"
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            borderRadius="12px"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMedia({ medias, initialIndex: index });
                            }}
                        >
                            {media.type === "image" ? (
                                <Image
                                    src={media.url}
                                    alt="Post Image"
                                    maxW="100%"
                                    maxH={maxHeight}
                                    objectFit="contain"
                                    borderRadius="12px"
                                />
                            ) : media.type === "video" ? (
                                <Box as="video"
                                    ref={(el) => (videoRefs.current[index] = el)}
                                    muted
                                    loop
                                    playsInline
                                    controls
                                    sx={{
                                        borderRadius: "12px",
                                        width: "100%",
                                        maxH: maxHeight,
                                        objectFit: "contain",
                                        bg: "black",
                                    }}
                                >
                                    <source src={media.url} type="video/mp4" />
                                </Box>
                            ) : (
                                <AudioPlayer url={media.url} onModalClick={() => setSelectedMedia({ medias, initialIndex: index })} />
                            )}
                        </Box>
                    </SwiperSlide>
                ))}
            </Swiper>

            {selectedMedia && (
                <ModalPost
                    medias={selectedMedia.medias}
                    initialIndex={selectedMedia.initialIndex}
                    isOpen={!!selectedMedia}
                    onClose={() => setSelectedMedia(null)}
                />
            )}
        </Box>
    );
};

export default Carousels;
