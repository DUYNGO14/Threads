import { useState, useEffect, useRef } from "react";
import {
    Button, CloseButton, Flex, FormControl, Image, Input, Modal,
    ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader,
    ModalOverlay, Text, Textarea, useColorModeValue, Box, IconButton, Tooltip,
    Divider
} from "@chakra-ui/react";
import { BsFillImageFill } from "react-icons/bs";
import PostPreview from "./PostPreview";
import { MAX_CHAR, MAX_FILES, ALLOWED_TYPES, MAX_FILE_SIZE_MB } from "../constant/uploads";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import postsAtom from "../atoms/postsAtom";
import useDebounceSubmit from "../hooks/useDebounceSubmit";
import api from "../services/api.js";
const CreatePostModal = ({ isOpen, onClose, username }) => {
    const [postText, setPostText] = useState("");
    const [mediaFiles, setMediaFiles] = useState([]);
    const [tags, setTags] = useState("");
    const [remainingChar, setRemainingChar] = useState(MAX_CHAR)
    const imageRef = useRef(null);
    const user = useRecoilValue(userAtom);
    const [posts, setPosts] = useRecoilState(postsAtom);
    const showToast = useShowToast();
    useEffect(() => {
        return () => mediaFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    }, [mediaFiles]);

    const handleTextChange = (e) => {
        const inputText = e.target.value.slice(0, MAX_CHAR);
        setPostText(inputText);
        setRemainingChar(MAX_CHAR - inputText.length);
    };

    const handleTagChange = (e) => {
        const inputTags = e.target.value.slice(0, 100); // Giới hạn độ dài tối đa của tags
        setTags(inputTags);
    };

    const isValidFile = (file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            showToast("Error", `Invalid file type: ${file.name}`, "error");
            return false;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            showToast("Error", `File too large (${MAX_FILE_SIZE_MB}MB max): ${file.name}`, "error");
            return false;
        }
        return true;
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        const spaceLeft = MAX_FILES - mediaFiles.length;

        if (spaceLeft <= 0) {
            showToast("Error", `Maximum ${MAX_FILES} files allowed`, "error");
            return;
        }

        const limitedFiles = selected.slice(0, spaceLeft);
        const validFiles = limitedFiles.filter(isValidFile);

        const newFiles = validFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            type: file.type.includes("video")
                ? "video"
                : file.type.includes("audio")
                    ? "audio"
                    : "image",
        }));

        setMediaFiles((prev) => [...prev, ...newFiles]);
    };
    const handleRemoveFile = (index) => {
        URL.revokeObjectURL(mediaFiles[index].preview);
        setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    };

    const handleClearForm = () => {
        setPostText(""); // Xóa nội dung bài viết
        setMediaFiles([]); // Xóa danh sách tệp đính kèm
        setRemainingChar(MAX_CHAR); // Đặt lại số ký tự còn lại
        setTags(""); // Xóa nội dung tags
        imageRef.current.value = null; // Đặt lại giá trị của input file
    };
    const submitPost = async () => {
        if (!postText.trim()) {
            showToast("Error", "Post content is required", "error");
            return;
        }

        const formData = new FormData();
        formData.append("postedBy", user._id);
        formData.append("text", postText);
        formData.append("tags", tags); // Chuyển đổi mảng tags thành chuỗi JSON
        mediaFiles.forEach(({ file }) => formData.append("media", file));

        try {
            const res = await api.post("/api/posts/create", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            const { status, message, data } = res.data;
            if (status === "error") {
                showToast("Error", message || "Failed to create post", "error");
                return;
            }
            showToast("Success", "Post created successfully", "success");
            setPosts((prev) => [data, ...prev]);

            onClose();
            handleClearForm();
        } catch (error) {
            console.error("Error creating post:", error);

            // Hiển thị thông báo lỗi chi tiết từ API
            const errorMessage =
                error.response?.data?.message || // Lấy thông báo từ phản hồi API
                error.message || // Lấy thông báo mặc định từ Axios
                "An unexpected error occurred"; // Thông báo mặc định nếu không có thông tin
            showToast("Error", errorMessage, "error");
        }
    };

    const { handleSubmit: handleCreatePost, isLoading } = useDebounceSubmit(submitPost);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered  >
            <ModalOverlay backdropFilter="blur(10px)" />
            <ModalContent bg={useColorModeValue('gray.100', 'gray.dark')}>
                <ModalHeader fontSize="xl" fontWeight="bold" textAlign="center" >New thread</ModalHeader>
                <Divider />
                <ModalCloseButton />
                <ModalBody>
                    <FormControl>

                        <PostPreview
                            user={user}
                            postText={postText}
                            tags={tags}
                            mediaFiles={mediaFiles}
                            onRemoveFile={handleRemoveFile}
                            onTextChange={handleTextChange}
                            handleTagChange={handleTagChange} />

                        <Flex justify="space-between" align="center" mt={2}>
                            <Text fontSize="xs" fontWeight="bold" color={remainingChar < 50 ? "red.500" : "gray.500"}>
                                {remainingChar}/{MAX_CHAR} characters remaining
                            </Text>
                            <Tooltip label="Add media">
                                <IconButton
                                    icon={<BsFillImageFill />}
                                    onClick={() => imageRef.current.click()}
                                    colorScheme="blue"
                                    variant="ghost"
                                    aria-label="Add media"
                                    _hover={{ transform: "scale(1.1)" }}
                                    transition="all 0.2s"
                                    isDisabled={mediaFiles.length >= MAX_FILES}
                                />
                            </Tooltip>
                        </Flex>

                        <Input
                            type="file"
                            hidden
                            ref={imageRef}
                            multiple
                            accept="image/*,video/*,audio/*"
                            onChange={handleFileChange}
                            disabled={mediaFiles.length >= MAX_FILES}
                        />
                    </FormControl>

                </ModalBody>

                <ModalFooter>
                    <Button onClick={handleClearForm} colorScheme="red" mr={3}>
                        Delete
                    </Button>
                    <Button onClick={handleCreatePost} colorScheme="blue" isLoading={isLoading}>Post</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default CreatePostModal;

