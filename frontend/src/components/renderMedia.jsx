import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { BsFillCameraVideoFill, BsFillMicFill } from "react-icons/bs";

const renderMedia = (file, index) => {
    switch (file.type) {
        case "image":
            return (
                <Image
                    src={file.preview}
                    alt={`Image ${index + 1}`}
                    w="full"
                    maxH="300px"
                    objectFit="contain"
                    borderRadius="md"
                />
            );
        case "video":
            return (
                <Box>
                    <Flex align="center" mb={2}>
                        <BsFillCameraVideoFill size={20} style={{ marginRight: 8 }} />
                        <Text fontSize="sm" fontWeight="medium">Video {index + 1}</Text>
                    </Flex>
                    <video
                        src={file.preview}
                        controls
                        style={{ width: "100%", maxHeight: "350px", borderRadius: "8px" }}
                    />
                </Box>
            );
        case "audio":
            return (
                <Box>
                    <Flex align="center" mb={2}>
                        <BsFillMicFill size={20} style={{ marginRight: 8 }} />
                        <Text fontSize="sm" fontWeight="medium">Audio {index + 1}</Text>
                    </Flex>
                    <audio
                        src={file.preview}
                        controls
                        style={{ width: "100%", height: "40px" }}
                    />
                </Box>
            );
        default:
            return null;
    }
};

export default renderMedia;