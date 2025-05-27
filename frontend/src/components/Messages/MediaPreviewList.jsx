// components/Messages/MediaPreviewList.jsx
import { Box, IconButton, Image } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { useEffect, useMemo } from "react";

const MediaPreviewList = ({ mediaFiles, setMediaFiles }) => {
    // Tạo URL cho mỗi file
    const previews = useMemo(() => {
        return mediaFiles.map(file => ({
            file,
            url: URL.createObjectURL(file),
        }));
    }, [mediaFiles]);

    // Cleanup URLs khi mediaFiles thay đổi hoặc component unmount
    useEffect(() => {
        return () => {
            previews.forEach(p => URL.revokeObjectURL(p.url));
        };
    }, [previews]);

    const handleRemove = (indexToRemove) => {
        setMediaFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <>
            {mediaFiles.map((file, index) => {
                const isImage = file.type.startsWith("image/");
                const isVideo = file.type.startsWith("video/");
                const isAudio = file.type.startsWith("audio/");
                const previewUrl = URL.createObjectURL(file);

                return (
                    <Box
                        key={index}
                        position="relative"
                        borderRadius="md"
                        overflow="hidden"
                        border="1px solid white"
                        w="64px"
                        h="64px"
                        flexShrink={0}
                    >
                        {isImage && (
                            <Image
                                src={previewUrl}
                                alt="preview"
                                boxSize="100%"
                                objectFit="cover"
                            />
                        )}

                        {isVideo && (
                            <video src={previewUrl} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}

                        {isAudio && (
                            <audio src={previewUrl} controls style={{ width: "100%" }} />
                        )}

                        <IconButton
                            icon={<CloseIcon />}
                            size="xs"
                            position="absolute"
                            top={1}
                            right={1}
                            onClick={() => handleRemove(index)}
                            aria-label="Remove media"
                            colorScheme="blackAlpha"
                        />
                    </Box>
                );
            })}
        </>
    );
};

export default MediaPreviewList;
