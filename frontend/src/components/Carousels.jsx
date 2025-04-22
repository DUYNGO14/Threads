import { Box, Image, useBreakpointValue } from "@chakra-ui/react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import { useState, useEffect, useRef, useCallback } from "react";
import ModalPost from "./ModalPost";
import AudioPlayer from "./AudioPlayer";

const Carousels = ({ medias }) => {
    const [selectedMedia, setSelectedMedia] = useState(null);
    const videoRefs = useRef([]);
    const [imageSizes, setImageSizes] = useState({});
    const swiperRef = useRef(null);

    // Kích thước responsive
    const maxWidth = useBreakpointValue({ base: "90%", md: "400px", lg: "500px" });
    const maxHeight = useBreakpointValue({ base: "60vh", md: "70vh", lg: "80vh" });

    // Tự động phát/dừng video khi vào/ra màn hình
    useEffect(() => {
        if (!videoRefs.current.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const video = entry.target;
                    if (entry.isIntersecting) {
                        video.play();
                    } else {
                        video.pause();
                    }
                });
            },
            { threshold: 0.8 }
        );

        videoRefs.current.forEach((video) => video && observer.observe(video));

        return () => {
            videoRefs.current.forEach((video) => video && observer.unobserve(video));
        };
    }, [medias]);

    const handleImageLoad = useCallback((index, event) => {
        const { naturalWidth, naturalHeight } = event.target;
        setImageSizes((prevSizes) => ({
            ...prevSizes,
            [index]: { width: naturalWidth, height: naturalHeight },
        }));
    }, []);

    return (
        <Box position="relative" overflow="hidden" w="100%">
            <Swiper
                modules={[Pagination]}
                pagination={medias.length > 1 ? { clickable: true, dynamicBullets: true } : false}
                spaceBetween={10}
                slidesPerView={"auto"}
                centeredSlides={false}
                style={{
                    width: "100%",
                    paddingBottom: medias.length > 1 ? "8px" : "0",
                    display: "flex",
                    justifyContent: "flex-start",
                }}
                onSwiper={(swiper) => (swiperRef.current = swiper)}
                onSlideChange={() => {
                    document.querySelectorAll("audio").forEach((audio) => audio.pause());
                }}
            >
                {medias.map((media, index) => (
                    <SwiperSlide

                        key={index}
                        style={{
                            width: "auto",
                            maxWidth: "100%",
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            borderRadius: "12px",
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            display="flex"
                            cursor="pointer"
                            justifyContent="center"
                            alignItems="center"
                            maxW="100%"
                            maxH="90vh"
                            overflow="hidden"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMedia(media);
                            }}
                        >
                            {media.type === "image" ? (
                                <Image
                                    src={media.url}
                                    alt="Post Image"
                                    maxWidth="100%"
                                    maxHeight={maxHeight}
                                    objectFit="contain"
                                    borderRadius="12px"
                                    onLoad={(e) => handleImageLoad(index, e)}
                                />
                            ) : media.type === "video" ? (
                                <Box onClick={() => setSelectedMedia(media)} cursor="pointer" maxW="100%" overflow="hidden">
                                    <video
                                        ref={(el) => (videoRefs.current[index] = el)}
                                        muted
                                        loop
                                        playsInline
                                        controls
                                        style={{
                                            borderRadius: "12px",
                                            width: "100%",
                                            maxHeight: maxHeight,
                                            objectFit: "contain",
                                        }}
                                    >
                                        <source src={media.url} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </Box>
                            ) : (
                                <AudioPlayer url={media.url} onModalClick={() => setSelectedMedia(media)} />
                            )}
                        </Box>
                    </SwiperSlide>
                ))}
            </Swiper>

            {selectedMedia && (
                <ModalPost
                    mediaUrl={selectedMedia.url}
                    mediaType={selectedMedia.type}
                    isOpen={!!selectedMedia}
                    onClose={() => setSelectedMedia(null)}
                />
            )}
        </Box>
    );
};

export default Carousels;
