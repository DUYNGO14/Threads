import { useState, useEffect, useRef, useCallback } from "react";
import {
    Button, CloseButton, Flex, FormControl, Image, Input, Modal,
    ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader,
    ModalOverlay, Text, Textarea, useColorModeValue, Box, IconButton, Tooltip,
    Tabs, TabList, TabPanels, Tab, TabPanel
} from "@chakra-ui/react";
import { BsFillImageFill, BsFillCameraVideoFill, BsFillMicFill } from "react-icons/bs";
import PostPreview from "./PostPreview";
import { MAX_CHAR, MAX_FILES, ALLOWED_TYPES, MAX_FILE_SIZE_MB } from "../constant/uploads";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import postsAtom from "../atoms/postsAtom";
import useDebounceSubmit from "../hooks/useDebounceSubmit";

const CreatePostModal = ({ isOpen, onClose, username }) => {
    const [postText, setPostText] = useState("");
    const [mediaFiles, setMediaFiles] = useState([]);
    const [remainingChar, setRemainingChar] = useState(MAX_CHAR);
    const imageRef = useRef(null);
    const user = useRecoilValue(userAtom);
    const [posts, setPosts] = useRecoilState(postsAtom);
    const showToast = useShowToast();

    // Cleanup preview URLs on mediaFiles change
    useEffect(() => {
        return () => {
            mediaFiles.forEach((file) => URL.revokeObjectURL(file.preview));
        };
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
            showToast("Error", `File too large (max ${MAX_FILE_SIZE_MB}MB): ${file.name}`, "error");
            return false;
        }

        return true;
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        const spaceLeft = MAX_FILES - mediaFiles.length;

        if (spaceLeft <= 0) {
            showToast("Error", `You can upload up to ${MAX_FILES} files`, "error");
            return;
        }

        const limitedFiles = selected.slice(0, spaceLeft);
        const validFiles = limitedFiles.filter(isValidFile);

        const newFiles = validFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith("video")
                ? "video"
                : file.type.startsWith("audio")
                    ? "audio"
                    : "image",
        }));

        setMediaFiles((prev) => [...prev, ...newFiles]);
    };

    const handleRemoveFile = (index) => {
        URL.revokeObjectURL(mediaFiles[index].preview);
        setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    };

    const submitPost = async () => {
        if (!postText.trim()) {
            showToast("Error", "Please enter some text", "error");
            return;
        }

        const formData = new FormData();
        formData.append("postedBy", user._id);
        formData.append("text", postText);

        mediaFiles.forEach(({ file }) => formData.append("media", file));

        const res = await fetch("/api/posts/create", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        if (data.error) {
            showToast("Error", data.error, "error");
            return;
        }

        showToast("Success", "Post created successfully", "success");

        if (username === user.username) {
            setPosts((prev) => [data, ...prev]);
        }

        onClose();
        setPostText("");
        setMediaFiles([]);
    };

    const { handleSubmit: handleCreatePost, isLoading } = useDebounceSubmit(submitPost);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay backdropFilter="blur(10px)" />
            <ModalContent>
                <ModalHeader fontSize="2xl" fontWeight="bold">Create a New Post</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Tabs variant="enclosed" colorScheme="blue">
                        <TabList mb={4}>
                            <Tab>Edit</Tab>
                            <Tab>Preview</Tab>
                        </TabList>
                        <TabPanels>
                            <TabPanel p={0}>
                                <FormControl>
                                    <Textarea
                                        placeholder="What's on your mind?"
                                        onChange={handleTextChange}
                                        value={postText}
                                        minH="150px"
                                        fontSize="lg"
                                        resize="none"
                                        _focus={{
                                            borderColor: "blue.500",
                                            boxShadow: "0 0 0 1px blue.500"
                                        }}
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
                                        accept="image/*,video/*,audio/*"
                                        onChange={handleFileChange}
                                        disabled={mediaFiles.length >= MAX_FILES}
                                    />
                                    <Text fontSize="xs" mt={2}>Allowed types: {ALLOWED_TYPES.join(", ")}</Text>
                                </FormControl>

                                {mediaFiles.length > 0 && (
                                    <Box mt={5}>
                                        <Text fontSize="sm" fontWeight="medium" mb={2}>
                                            Media Preview ({mediaFiles.length}/{MAX_FILES})
                                        </Text>
                                        <Flex wrap="wrap" gap={3}>
                                            {mediaFiles.map((file, index) => (
                                                <Box
                                                    key={index}
                                                    position="relative"
                                                    w="120px"
                                                    h="120px"
                                                    borderRadius="lg"
                                                    overflow="hidden"
                                                    boxShadow="md"
                                                    _hover={{ transform: "scale(1.02)" }}
                                                    transition="all 0.2s"
                                                >
                                                    {file.type === "image" ? (
                                                        <Image
                                                            src={file.preview}
                                                            alt="Preview"
                                                            w="full"
                                                            h="full"
                                                            objectFit="cover"
                                                        />
                                                    ) : (
                                                        <Box w="full" h="full" bg="gray.100" p={2} display="flex" alignItems="center" justifyContent="center">
                                                            {file.type === "video" ? <BsFillCameraVideoFill size={24} /> : <BsFillMicFill size={24} />}
                                                        </Box>
                                                    )}
                                                    <CloseButton
                                                        position="absolute"
                                                        top={2}
                                                        right={2}
                                                        bg="rgba(0,0,0,0.5)"
                                                        color="white"
                                                        _hover={{ bg: "rgba(0,0,0,0.7)" }}
                                                        onClick={() => handleRemoveFile(index)}
                                                    />
                                                </Box>
                                            ))}
                                        </Flex>
                                    </Box>
                                )}
                            </TabPanel>
                            <TabPanel p={0}>
                                <PostPreview user={user} postText={postText} mediaFiles={mediaFiles} />
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </ModalBody>

                <ModalFooter>
                    <Button
                        colorScheme="blue"
                        mr={3}
                        onClick={handleCreatePost}
                        isLoading={isLoading}
                        px={8}
                        _hover={{
                            transform: "translateY(-1px)",
                            boxShadow: "lg"
                        }}
                        transition="all 0.2s"
                    >
                        Post
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default CreatePostModal;
