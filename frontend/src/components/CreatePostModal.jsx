import { useState, useEffect, useRef } from "react";
import {
    Button, Flex, FormControl, IconButton, Input, Text, Tooltip
} from "@chakra-ui/react";
import { BsFillImageFill } from "react-icons/bs";
import PostPreview from "./PostPreview";
import BaseModal from "@components/Modal/BaseModal";
import { MAX_CHAR, MAX_FILES, ALLOWED_TYPES, MAX_FILE_SIZE_MB } from "../constant/uploads";
import useShowToast from "@hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "@atoms/userAtom";
import postsAtom from "@atoms/postsAtom";
import useDebounceSubmit from "@hooks/useDebounceSubmit";
import api from "@services/api";

const CreatePostModal = ({ isOpen, onClose }) => {
    const [postText, setPostText] = useState("");
    const [mediaFiles, setMediaFiles] = useState([]);
    const [tags, setTags] = useState("");
    const [remainingChar, setRemainingChar] = useState(MAX_CHAR);
    const [suggestedTags, setSuggestedTags] = useState([]);
    const [notification, setNotification] = useState("all");
    const imageRef = useRef(null);
    const user = useRecoilValue(userAtom);
    const [posts, setPosts] = useRecoilState(postsAtom);
    const showToast = useShowToast();

    useEffect(() => {
        return () => mediaFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    }, [mediaFiles]);

    useEffect(() => {
        if (!isOpen) return;
        const fetchTags = async () => {
            try {
                const res = await api.get("/api/posts/tags");
                setSuggestedTags(res.data);
            } catch (err) {
                console.error("Failed to fetch tags:", err);
            }
        };
        fetchTags();
    }, [isOpen]);

    const handleTextChange = (e) => {
        const inputText = e.target.value.slice(0, MAX_CHAR);
        setPostText(inputText);
        setRemainingChar(MAX_CHAR - inputText.length);
    };

    const handleTagChange = (e) => setTags(e.target.value.slice(0, 100));

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
        setRemainingChar(MAX_CHAR);
        setTags("");
        if (imageRef.current) imageRef.current.value = null;
    };

    const submitPost = async () => {
        if (!postText.trim()) {
            showToast("Error", "Post content is required", "error");
            return;
        }
        const cleanedText = postText.replace(/\n{3,}/g, '\n');
        const formData = new FormData();
        formData.append("postedBy", user._id);
        formData.append("text", cleanedText);
        formData.append("tags", tags);
        formData.append("notification", notification);
        mediaFiles.forEach(({ file }) => formData.append("media", file));

        try {
            const res = await api.post("/api/posts/create", formData, {
                headers: { "Content-Type": "multipart/form-data" },
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
            const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred";
            showToast("Error", errorMessage, "error");
        }
    };

    const { handleSubmit: handleCreatePost, isLoading } = useDebounceSubmit(submitPost);

    const footer = (
        <>
            <Button onClick={handleClearForm} colorScheme="red" mr={3}>
                Delete
            </Button>
            <Button onClick={handleCreatePost} colorScheme="blue" isLoading={isLoading}>
                Post
            </Button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="New thread" footer={footer}>
            <FormControl>
                <PostPreview
                    user={user}
                    postText={postText}
                    tags={tags}
                    mediaFiles={mediaFiles}

                    onRemoveFile={handleRemoveFile}
                    onTextChange={handleTextChange}
                    handleTagChange={handleTagChange}
                    setNotification={setNotification}
                    notification={notification}
                    suggestedTags={suggestedTags}
                />
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
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    disabled={mediaFiles.length >= MAX_FILES}
                />
            </FormControl>
        </BaseModal>
    );
};

export default CreatePostModal;
