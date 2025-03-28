import { Box, Image } from "@chakra-ui/react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import { useState, useEffect, useRef } from "react";
import ModalPost from "./ModalPost";

const Carousels = ({ medias }) => {
    const [selectedMedia, setSelectedMedia] = useState(null);
    const videoRefs = useRef([]);
    const [imageSizes, setImageSizes] = useState({});

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
            { threshold: 0.5 }
        );

        videoRefs.current.forEach((video) => {
            if (video) observer.observe(video);
        });

        return () => {
            videoRefs.current.forEach((video) => {
                if (video) observer.unobserve(video);
            });
        };
    }, [medias]);

    // Xử lý khi ảnh tải xong để lấy kích thước thực
    const handleImageLoad = (index, event) => {
        const { naturalWidth, naturalHeight } = event.target;
        setImageSizes((prevSizes) => ({
            ...prevSizes,
            [index]: { width: naturalWidth, height: naturalHeight },
        }));
    };

    return (
        <>
            <Swiper
                modules={[Pagination]}
                pagination={medias.length > 1 ? { clickable: true } : false}
                spaceBetween={10}
                slidesPerView={"auto"}
                style={{ width: "100%", paddingBottom: medias.length > 1 ? "10px" : "0", display: "flex", justifyContent: "flex-start" }}
            >
                {medias.map((media, index) => {
                    const imgSize = imageSizes[index] || { width: 600 }; // Mặc định nếu chưa load kích thước ảnh

                    return (
                        <SwiperSlide
                            key={index}
                            style={{
                                width: "auto",
                                maxWidth: `${media.type === "video" ? "600px" : Math.min(imgSize.width, 600)}px`,
                                display: "flex",
                                justifyContent: "flex-start",
                                borderRadius: "12px",
                            }}
                        >
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                maxWidth="100%"
                                overflow="hidden"
                                borderRadius="12px"
                                cursor="pointer"
                                onClick={() => setSelectedMedia(media)}
                            >
                                {media.type === "image" ? (
                                    <Image
                                        src={media.url}
                                        objectFit="contain"
                                        maxWidth="100%"
                                        maxHeight="50vh"
                                        borderRadius="12px"
                                        onLoad={(e) => handleImageLoad(index, e)} // Cập nhật kích thước khi ảnh tải xong
                                    />
                                ) : (
                                    <video
                                        ref={(el) => (videoRefs.current[index] = el)}
                                        muted
                                        loop
                                        playsInline
                                        controls
                                        style={{
                                            borderRadius: "12px",
                                            width: "100%", // Đảm bảo video chiếm đủ khung
                                            maxWidth: "500px", // Giới hạn chiều rộng tối đa
                                            maxHeight: "70vh",
                                            aspectRatio: "auto",
                                        }}
                                    >
                                        <source src={media.url} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                )}
                            </Box>
                        </SwiperSlide>
                    );
                })}
            </Swiper>

            {selectedMedia && (
                <ModalPost
                    mediaUrl={selectedMedia.url}
                    mediaType={selectedMedia.type}
                    isOpen={!!selectedMedia}
                    onClose={() => setSelectedMedia(null)}
                />
            )}
        </>
    );
};

export default Carousels;
