import {
    Box,
    Image,
    useBreakpointValue,
} from "@chakra-ui/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useState, useRef, useEffect, useCallback } from "react";
import ModalPost from "./ModalPost";
import AudioPlayer from "./AudioPlayer";

const Carousels = ({ medias }) => {
    const [selectedMedia, setSelectedMedia] = useState(null);
    const videoRefs = useRef([]);
    const swiperRef = useRef(null);

    const maxWidth = useBreakpointValue({
        base: "90vw",
        md: "85vw",
        lg: "65vw",
    });

    const maxHeight = useBreakpointValue({
        base: "50vh",
        md: "60vh",
        lg: "70vh",
    });

    const getAspectRatio = (media) => {
        if (media.type === "audio") return 5; // fixed ratio for audio
        if (media.width && media.height) return media.width / media.height;
        return 1;
    };

    const handleVideoPlayPause = useCallback(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const video = entry.target;
                    if (entry.isIntersecting) {
                        videoRefs.current.forEach((v) => v !== video && v?.pause());
                        video.play().catch((err) => console.error("Video play failed:", err));
                    } else {
                        video.pause();
                    }
                });
            },
            { threshold: 0.75 }
        );

        videoRefs.current.forEach((video) => video && observer.observe(video));
        return observer;
    }, []);

    useEffect(() => {
        const observer = handleVideoPlayPause();
        return () => {
            observer.disconnect();
            videoRefs.current.forEach((video) => video && observer.unobserve(video));
        };
    }, [handleVideoPlayPause]);

    const handleSwiperSlideChange = useCallback(() => {
        document.querySelectorAll("audio").forEach((audio) => audio.pause());
    }, []);

    return (
        <Box position="relative" overflow="hidden" w="100%">
            <Swiper
                modules={[Pagination]}
                pagination={
                    medias.length > 1 ? { clickable: true, dynamicBullets: true } : false
                }
                spaceBetween={10}
                slidesPerView={1}
                onSwiper={(swiper) => (swiperRef.current = swiper)}
                onSlideChange={handleSwiperSlideChange}
                style={{ width: "100%" }}
            >
                {medias.map((media, index) => (
                    <SwiperSlide key={index} style={{ width: "100%" }}>
                        <Box
                            cursor="pointer"
                            maxW={maxWidth}
                            maxH={maxHeight}
                            overflow="hidden"
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            borderRadius="12px"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMedia({ medias, initialIndex: index });
                            }}
                            sx={{
                                aspectRatio: getAspectRatio(media),
                                position: "relative",
                                backgroundColor: "#f0f0f0",
                            }}
                        >
                            {media.type === "image" ? (
                                <Image
                                    src={media.url}
                                    alt="Post Image"
                                    position="absolute"
                                    top="0"
                                    left="0"
                                    width="100%"
                                    height="100%"
                                    objectFit="cover"
                                    borderRadius="12px"
                                    loading="lazy"
                                />
                            ) : media.type === "video" ? (
                                <Box
                                    as="video"
                                    ref={(el) => (videoRefs.current[index] = el)}
                                    muted
                                    loop
                                    playsInline
                                    controls
                                    preload="metadata"
                                    sx={{
                                        borderRadius: "12px",
                                        position: "absolute",
                                        top: "0",
                                        left: "0",
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                >
                                    <source src={media.url} type="video/mp4" />
                                </Box>
                            ) : (
                                <Box>
                                    <AudioPlayer url={media.url} />
                                </Box>
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
