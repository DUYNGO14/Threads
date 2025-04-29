import { useState, useEffect, useRef } from "react";
import {
    Button, CloseButton, Flex, FormControl, Image, Input, Modal,
    ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader,
    ModalOverlay, Text, Textarea, useColorModeValue, Box, IconButton, Tooltip
} from "@chakra-ui/react";
import { BsFillImageFill, BsFillCameraVideoFill, BsFillMicFill } from "react-icons/bs";
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
    const [remainingChar, setRemainingChar] = useState(MAX_CHAR);
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
        setPostText("");
        setMediaFiles([]);
    };

    const submitPost = async () => {
        if (!postText.trim()) {
            showToast("Error", "Post content is required", "error");
            return;
        }

        const formData = new FormData();
        formData.append("postedBy", user._id);
        formData.append("text", postText);
        mediaFiles.forEach(({ file }) => formData.append("media", file));

        try {
            const { data } = await api.post("/posts/create", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (data.error) throw new Error(data.error);

            showToast("Success", "Post created successfully", "success");
            if (username === user.username) setPosts((prev) => [data, ...prev]);

            onClose();
            handleClearForm();
        } catch (error) {
            showToast("Error", error.message, "error");
        }
    };

    const { handleSubmit: handleCreatePost, isLoading } = useDebounceSubmit(submitPost);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered  >
            <ModalOverlay backdropFilter="blur(10px)" />
            <ModalContent bg={useColorModeValue('gray.100', '#101010')}>
                <ModalHeader fontSize="xl" fontWeight="bold" textAlign="center" >New thread</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl>
                        <Box mt={2}>
                            <PostPreview
                                user={user}
                                postText={postText}
                                mediaFiles={mediaFiles}
                                onRemoveFile={handleRemoveFile}
                                onTextChange={handleTextChange} />
                        </Box>
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
                    <Button onClick={handleClearForm} colorScheme="red" mr={3}>Delete</Button>
                    <Button onClick={handleCreatePost} colorScheme="blue" isLoading={isLoading}>Post</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default CreatePostModal;

