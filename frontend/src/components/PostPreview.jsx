import Slider from "react-slick";
import {
    Avatar, Box, CloseButton, Divider, Flex, Image,
    Input,
    Text, Textarea, useColorModeValue
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import renderMedia from "./renderMedia";


const PostPreview = ({
    user, postText, tags, mediaFiles,
    onRemoveFile, onTextChange, handleTagChange,
    suggestedTags = [],
}) => {
    const previewBgColor = useColorModeValue('gray.100', 'gray.dark');
    const hoverBgColor = useColorModeValue("gray.100", "gray.700");
    const [filteredTags, setFilteredTags] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Mỗi khi suggestedTags thay đổi, set lại danh sách filter
    useEffect(() => {
        setFilteredTags(suggestedTags);
    }, [suggestedTags]);

    const handleTagInputChange = (e) => {
        const inputValue = e.target.value.slice(0, 100); // Giới hạn độ dài tối đa của tags
        handleTagChange({ target: { value: inputValue } });

        // Lọc từ danh sách gợi ý khi người dùng nhập
        const filtered = suggestedTags.filter((tag) =>
            tag.toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredTags(filtered);
    };

    const handleTagFocus = () => {
        // Hiển thị danh sách gợi ý khi focus vào ô nhập tag
        setShowSuggestions(true);
    };

    const handleTagSelect = (tag) => {
        // Chọn tag từ gợi ý và cập nhật vào ô nhập tag
        const updatedTags = tag;
        handleTagChange({ target: { value: updatedTags } });
        setShowSuggestions(false); // Ẩn danh sách gợi ý sau khi chọn
    };


    const handleTagBlur = () => {
        // Ẩn danh sách gợi ý sau khi không focus nữa
        setShowSuggestions(false);
    };

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
                <Box flexGrow={1} ml={4} >
                    <Input
                        value={tags}
                        onChange={handleTagInputChange}
                        variant={"flushed"}
                        focusBorderColor="none"
                        type="text"
                        placeholder="Add a topic"
                        onBlur={handleTagBlur}
                        onFocus={handleTagFocus} // Hiển thị gợi ý khi focus
                    />
                    {showSuggestions && filteredTags.length > 0 && (
                        <Box
                            shadow="md"
                            bg={previewBgColor}
                            mt={1}
                            position="absolute"
                            zIndex={10}
                            borderRadius="md"
                            w="100%"
                            maxWidth="200px"
                        >
                            {filteredTags.slice(0, 5).map((tag, index) => (
                                <Box
                                    key={index}
                                    p={2}
                                    _hover={{ bg: hoverBgColor }}
                                    cursor="pointer"
                                    onMouseDown={() => handleTagSelect(tag)}
                                >
                                    {tag}
                                </Box>
                            ))}
                        </Box>
                    )}
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


