import { AddIcon } from "@chakra-ui/icons";
import {
    Button,
    CloseButton,
    Flex,
    FormControl,
    Image,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    Textarea,
    useColorModeValue,
    useDisclosure,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import { BsFillImageFill } from "react-icons/bs";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import { useParams } from "react-router-dom";
import postsAtom from "../atoms/postsAtom";

const MAX_CHAR = 500;
const MAX_FILES = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm"];

const CreatePost = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [postText, setPostText] = useState("");
    const [mediaFiles, setMediaFiles] = useState([]);
    const imageRef = useRef(null);
    const [remainingChar, setRemainingChar] = useState(MAX_CHAR);
    const user = useRecoilValue(userAtom);
    const showToast = useShowToast();
    const [loading, setLoading] = useState(false);
    const [posts, setPosts] = useRecoilState(postsAtom);
    const { username } = useParams();

    // Cleanup Object URLs để tránh memory leak
    useEffect(() => {
        return () => {
            mediaFiles.forEach((file) => URL.revokeObjectURL(file.preview));
        };
    }, [mediaFiles]);

    const handleTextChange = (e) => {
        const inputText = e.target.value;
        setPostText(inputText.slice(0, MAX_CHAR));
        setRemainingChar(MAX_CHAR - inputText.length);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        if (mediaFiles.length + files.length > MAX_FILES) {
            showToast("Error", `You can upload up to ${MAX_FILES} files`, "error");
            return;
        }

        const validFiles = files.filter((file) => {
            if (!ALLOWED_TYPES.includes(file.type)) {
                showToast("Error", `Invalid file type: ${file.name}`, "error");
                return false;
            }
            return true;
        });

        const uniqueFiles = validFiles.filter((file) =>
            !mediaFiles.some((existing) => existing.file.name === file.name)
        );

        if (uniqueFiles.length === 0) {
            showToast("Error", "Duplicate or invalid files selected", "error");
            return;
        }

        const newFiles = uniqueFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith("video") ? "video" : "image",
        }));

        setMediaFiles([...mediaFiles, ...newFiles]);
    };

    const handleRemoveFile = (index) => {
        URL.revokeObjectURL(mediaFiles[index].preview);
        setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    };

    const handleCreatePost = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("postedBy", user._id);
            formData.append("text", postText);

            mediaFiles.forEach(({ file }) => {
                formData.append("media", file);
            });

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
                setPosts([data, ...posts]);
            }

            onClose();
            setPostText("");
            setMediaFiles([]);
        } catch (err) {
            showToast("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                position="fixed"
                bottom={10}
                right={10}
                leftIcon={<AddIcon />}
                bg={useColorModeValue("gray.300", "gray.dark")}
                onClick={onOpen}
                size={{ base: "sm", sm: "md" }}
            >
                Post
            </Button>
            <Modal isOpen={isOpen} onClose={onClose} centered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Create a Post</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormControl>
                            <Textarea
                                placeholder="Post content goes here..."
                                onChange={handleTextChange}
                                value={postText}
                            />
                            <Text fontSize="xs" fontWeight="bold" textAlign="right" m="1">
                                {remainingChar}/{MAX_CHAR}
                            </Text>

                            <Input
                                type="file"
                                hidden
                                ref={imageRef}
                                multiple
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                            />
                            <BsFillImageFill
                                style={{ marginLeft: "5px", cursor: "pointer" }}
                                size={16}
                                onClick={() => imageRef.current.click()}
                            />
                        </FormControl>

                        {mediaFiles.length > 0 && (
                            <Flex mt={5} wrap="wrap">
                                {mediaFiles.map((file, index) => (
                                    <Flex
                                        key={index}
                                        position="relative"
                                        m={2}
                                        w="100px"
                                        h="100px"
                                        borderRadius="md"
                                        overflow="hidden"
                                        bg="gray.100"
                                        justify="center"
                                        align="center"
                                    >
                                        {file.type === "image" ? (
                                            <Image src={file.preview} alt="Preview" w="full" h="full" objectFit="cover" />
                                        ) : (
                                            <video src={file.preview} controls width="100%" height="100%" />
                                        )}
                                        <CloseButton
                                            position="absolute"
                                            top={1}
                                            right={1}
                                            bg="gray.800"
                                            color="white"
                                            onClick={() => handleRemoveFile(index)}
                                        />
                                    </Flex>
                                ))}
                            </Flex>
                        )}
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={handleCreatePost} isLoading={loading}>
                            Post
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default CreatePost;
