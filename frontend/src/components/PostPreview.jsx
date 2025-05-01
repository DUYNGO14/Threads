import Slider from "react-slick";
import {
    Avatar, Box, CloseButton, Divider, Flex, Image,
    Input,
    Text, Textarea, useColorModeValue
} from "@chakra-ui/react";
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

const PostPreview = ({ user, mediaFiles, onRemoveFile, onTextChange, handleTagChange, postText, tags }) => {
    const previewBgColor = useColorModeValue("gray.100", "#101010");

    const sliderSettings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
    };

    return (
        <Box borderRadius="lg" p={4} boxShadow="md" maxH="600px" overflowY="auto">
            <Flex align="center" gap={1} mb={4}>
                <Box>
                    <Avatar size="sm" name={user.name} src={user.profilePic} mr={3} />
                </Box>
                <Box>
                    <Text fontWeight="bold">{user.name}</Text>
                    <Text fontSize="xs" color="gray.500">
                        {new Date().toLocaleDateString()}
                    </Text>
                </Box>
                <Box flexGrow={1} ml={4}   >
                    <Input value={tags} onChange={handleTagChange} variant={"flushed"} focusBorderColor="none" type="text" placeholder="Add a topic" />
                </Box>
            </Flex >

            <Textarea
                placeholder="What's new?"
                onChange={onTextChange}

                onInput={(e) => {
                    e.target.style.height = "auto"; // Reset chiều cao để tính toán lại
                    e.target.style.height = `${e.target.scrollHeight}px`; // Đặt chiều cao theo nội dung
                }}
                minH="50px"
                fontSize="md"
                resize="none"
                focusBorderColor="transparent"
                overflow="hidden" // Loại bỏ thanh cuộn
                value={postText} // optional: if you want controlled input
            />

            {
                mediaFiles.length > 0 && (
                    <>
                        <Divider my={4} />
                        <Box bg={previewBgColor} borderRadius="md" p={3}>
                            <Slider {...sliderSettings}>
                                {mediaFiles.map((file, index) => (
                                    <Box key={index} position="relative" px={2}>
                                        <CloseButton
                                            position="absolute"
                                            top={2}
                                            right={2}
                                            zIndex={1}
                                            bg="rgba(0,0,0,0.5)"
                                            color="white"
                                            _hover={{ bg: "rgba(0,0,0,0.7)" }}
                                            onClick={() => onRemoveFile?.(index)}
                                        />
                                        {renderMedia(file, index)}
                                    </Box>
                                ))}
                            </Slider>
                        </Box>
                    </>
                )
            }
        </Box >
    );
};

export default PostPreview;
