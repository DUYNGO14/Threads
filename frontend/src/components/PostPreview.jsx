import Slider from "react-slick";
import {
    Avatar, Box, CloseButton, Divider, Flex, Icon, IconButton, Image,
    Input, Select, Text, Textarea, useColorModeValue
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import api from "@services/api";
import MentionTextarea from "./MentionTextarea";
import { IoNotificationsOffSharp, IoNotificationsOutline } from "react-icons/io5";
const PostPreview = ({
    type = "create", user, postText, tags, mediaFiles,
    onRemoveFile, onTextChange, handleTagChange,
    suggestedTags = [], setNotification, notification
}) => {
    const previewBgColor = useColorModeValue('gray.100', 'gray.dark');
    const hoverBgColor = useColorModeValue("gray.100", "gray.700");
    const [filteredTags, setFilteredTags] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [followings, setFollowings] = useState([]);
    useEffect(() => {
        try {
            const fetchFollowings = async () => {
                const res = await api.get(`/api/users/${user.username}/following`);
                setFollowings(res.data);
                console.log(res.data);
            };
            fetchFollowings();
        } catch (err) {
            console.error("Failed to fetch followings:", err);
        }
    }, []);
    useEffect(() => {
        setFilteredTags(suggestedTags);
    }, [suggestedTags]);

    const handleTagInputChange = (e) => {
        const inputValue = e.target.value.slice(0, 100);
        handleTagChange({ target: { value: inputValue } });
        const filtered = suggestedTags.filter((tag) =>
            tag.toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredTags(filtered);
    };

    const handleTagFocus = () => setShowSuggestions(true);
    const handleTagSelect = (tag) => {
        handleTagChange({ target: { value: tag } });
        setShowSuggestions(false);
    };
    const handleTagBlur = () => setShowSuggestions(false);

    const sliderSettings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
    };
    const renderMedia = (file, index) => {
        const url = file.preview || file.url;
        if (file.type.startsWith("image")) {
            return <Image src={url} alt={`media-${index}`} maxH="300px" mx="auto" />;
        }
        if (file.type.startsWith("video")) {
            return (
                <Box as="video" src={url} controls maxH="300px" mx="auto" />
            );
        }
        if (file.type.startsWith("audio")) {
            return (
                <Box as="audio" src={url} controls width="100%" />
            );
        }
        return null;
    };
    return (
        <Box borderRadius="lg" p={4} boxShadow="md" maxH="600px" overflow="visible">
            <Flex align="center" gap={1} mb={4}>
                <Avatar size="sm" name={user.name} src={user.profilePic} mr={3} />
                <Box flexGrow={1}>
                    {/* <Text fontWeight="bold">{user.name}</Text> */}
                    <Flex align="center" gap={2}  >
                        <Text fontWeight="bold" fontSize="sm">{user.username}</Text>
                        <Text>·</Text>
                        <Text fontSize="xs">{new Date().toLocaleDateString()}</Text>
                    </Flex>
                    <Flex align="center" gap={2} mt={1}>
                        <IconButton
                            size="sm"
                            variant="ghost"
                            icon={<IoNotificationsOutline />}
                        />
                        <Select
                            value={notification}
                            onChange={(e) => setNotification(e.target.value)}
                            size="sm"
                            variant="flushed"
                            placeholder="Select"
                            bg={useColorModeValue("white", "gray.dark")}
                            focusBorderColor="transparent"
                            color={useColorModeValue("gray.900", "white")}
                            width="100%"
                        >
                            <option value="all">All</option>
                            <option value="following">Following</option>
                            <option value="followers">Follower</option>
                            <option value="nobody">Nobody</option>
                        </Select>
                    </Flex>

                </Box>
                <Box flexGrow={1} ml={4} position="relative">
                    <Input
                        value={tags}
                        onChange={handleTagInputChange}
                        variant="flushed"
                        focusBorderColor="none"
                        type="text"
                        placeholder="Add a topic"
                        onBlur={handleTagBlur}
                        onFocus={handleTagFocus}
                        px={4}
                        py={2}
                        bg={previewBgColor}
                    />

                    {/* Suggestions Box */}
                    {showSuggestions && filteredTags.length > 0 && (
                        <Box
                            shadow="md"
                            bg={previewBgColor}
                            mt={2}
                            position="absolute"
                            zIndex={1000}
                            borderRadius="md"
                            w="100%"
                            maxWidth="100%"
                            border="1px solid rgb(15, 15, 15)" // Thêm border cho suggestions box
                        >
                            {filteredTags.slice(0, 5).map((tag, index) => (
                                <Box
                                    key={index}
                                    p={3} // Tăng padding cho các mục suggestion
                                    _hover={{ bg: hoverBgColor }}
                                    cursor="pointer"
                                    borderBottom="1px solidrgb(15, 15, 15)" // Thêm đường kẻ giữa các mục
                                    onMouseDown={() => handleTagSelect(tag)}
                                >
                                    {tag}
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>

            </Flex>

            <MentionTextarea
                value={postText}
                onChange={onTextChange}
                mentionUsers={followings.map((u) => ({
                    id: u._id,
                    display: u.username,
                    avatar: u.profilePic,
                    fullName: u.name,
                }))}
                placeholder="What's new?"
            />

            {mediaFiles.length > 0 && (
                <>
                    <Divider my={4} />
                    <Box bg={previewBgColor} borderRadius="md" p={3}>
                        <Slider {...sliderSettings}>
                            {mediaFiles.map((item, index) => (
                                <Box key={index} position="relative" px={2}>

                                    {type === "create" && <CloseButton
                                        position="absolute"
                                        top={2}
                                        right={2}
                                        zIndex={1}
                                        bg="rgba(0,0,0,0.5)"
                                        color="white"
                                        _hover={{ bg: "rgba(0,0,0,0.7)" }}
                                        onClick={() => onRemoveFile?.(index)}
                                    />}
                                    {item.preview ? (
                                        renderMedia(item, index)
                                    ) : (
                                        renderMedia({
                                            type: item.type,
                                            url: item.url,
                                        }, index)
                                    )}
                                </Box>
                            ))}
                        </Slider>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default PostPreview;
