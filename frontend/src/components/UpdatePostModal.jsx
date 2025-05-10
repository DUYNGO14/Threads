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

const UpdatePostModal = ({ isOpen, onClose, post }) => {
    const [postText, setPostText] = useState(post.text || "");
    const [mediaFiles, setMediaFiles] = useState(post.media || []);
    const [tags, setTags] = useState(post.tags || "");
    const [remainingChar, setRemainingChar] = useState(MAX_CHAR);
    const [suggestedTags, setSuggestedTags] = useState([]);
    const imageRef = useRef(null);
    const user = useRecoilValue(userAtom);
    const [posts, setPosts] = useRecoilState(postsAtom);
    const showToast = useShowToast();
    useEffect(() => {
        return () => {
            mediaFiles.forEach((file) => {
                if (file.preview) URL.revokeObjectURL(file.preview);
            });
        };
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


    const handleClearForm = () => {

        setPostText("");
        setMediaFiles([]);
        setRemainingChar(MAX_CHAR);
        setTags("");
        if (imageRef.current) imageRef.current.value = null;
    };

    const submitPost = async () => {
        if (post.text === postText && post.tags === tags) {
            showToast("Info", "No changes detected", "info");
            return;
        }
        if (!postText.trim()) {
            showToast("Error", "Post content is required", "error");
            return;
        }
        const cleanedText = postText.replace(/\n{3,}/g, '\n');
        const formData = new FormData();
        formData.append("postedBy", user._id);
        formData.append("text", cleanedText);
        formData.append("tags", tags);

        try {
            const res = await api.put(`/api/posts/${post._id}/update`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const { status, message, data } = res.data;
            if (status === "error") {
                showToast("Error", message || "Failed to update post", "error");
                return;
            }
            showToast("Success", "Post updated successfully", "success");
            setPosts((prev) => prev.map(p => p._id === data._id ? data : p));
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
            <Button onClick={handleCreatePost} colorScheme="blue" isLoading={isLoading}>
                Update
            </Button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Update Post" footer={footer}>
            <FormControl>
                <PostPreview
                    type="update"
                    user={user}
                    postText={postText}
                    tags={tags}
                    mediaFiles={mediaFiles}
                    onTextChange={handleTextChange}
                    handleTagChange={handleTagChange}
                    suggestedTags={suggestedTags}
                />
                <Flex justify="space-between" align="center" mt={2}>
                    <Text fontSize="xs" fontWeight="bold" color={remainingChar < 50 ? "red.500" : "gray.500"}>
                        {remainingChar}/{MAX_CHAR} characters remaining
                    </Text>
                </Flex>
            </FormControl>
        </BaseModal>
    );
};

export default UpdatePostModal;
