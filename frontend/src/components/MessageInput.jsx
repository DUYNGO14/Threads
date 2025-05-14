import {
    Spinner,
    useDisclosure,
    IconButton,
    Box,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    HStack,
    Flex
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { IoSendSharp } from "react-icons/io5";
import { CiCircleRemove } from "react-icons/ci";
import { BsFillImageFill } from "react-icons/bs";
import { MdOutlineInsertEmoticon, MdOutlineGifBox } from "react-icons/md";
import TextareaAutosize from "react-textarea-autosize";
import { useRecoilValue, useSetRecoilState } from "recoil";
import EmojiPicker from "emoji-picker-react";
import PropTypes from "prop-types";
import GiphyPicker from "./GiphyPicker";
import useShowToast from "@hooks/useShowToast";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import api from "../services/api.js";
import { CloseIcon } from "@chakra-ui/icons";

const MessageInput = ({ setMessages }) => {
    const [messageText, setMessageText] = useState("");
    const [mediaFiles, setMediaFiles] = useState([]);
    const [isSending, setIsSending] = useState(false);

    const imageRef = useRef(null);

    const showToast = useShowToast();
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const setConversations = useSetRecoilState(conversationsAtom);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setMediaFiles((prev) => [...prev, ...files]);
            onOpen();
        }
    };

    const handleGifSelect = async (gifUrl) => {
        try {
            const res = await fetch(gifUrl);
            const blob = await res.blob();
            const file = new File([blob], "gif.gif", { type: "image/gif" });

            setMediaFiles((prev) => [...prev, file]);
            onOpen();
        } catch (error) {
            showToast("Error", "Unable to load GIF", "error");
        }
    };

    const resetInput = () => {
        setMessageText("");
        setMediaFiles([]);
        onClose();
    };

    const handleSendMessage = async () => {
        if ((!messageText.trim() && mediaFiles.length === 0) || isSending) return;

        setIsSending(true);
        try {
            const formData = new FormData();
            if (messageText.trim()) formData.append("message", messageText.trim());
            formData.append("conversationId", selectedConversation._id);

            mediaFiles.forEach((file) => formData.append("media", file));

            const res = await api.post("/api/messages", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const data = await res.data;
            if (data.error) return showToast("Error", data.error, "error");

            setMessages((prev) => [...prev, data]);

            setConversations((prevConvs) =>
                prevConvs.map((conv) =>
                    conv._id === selectedConversation._id
                        ? {
                            ...conv,
                            lastMessage: {
                                text: messageText || (mediaFiles.length > 0 ? "📎 Media" : ""),
                                sender: data.sender,
                            },
                        }
                        : conv
                )
            );

            resetInput();
        } catch (error) {
            showToast("Error", error.message, "error");
        } finally {
            setIsSending(false);
        }
    };

    const handleEmojiClick = (emoji) => {
        setMessageText((prev) => prev + emoji.emoji);
    };

    const previewMedia = () => {
        return (
            mediaFiles.map((file, idx) => {
                const url = URL.createObjectURL(file);
                const isImageOrGif = file.type.startsWith("image/");
                const isVideo = file.type.startsWith("video/");
                return (
                    <Box key={idx} position="relative" boxSize="70px" flexShrink={0}>
                        {isImageOrGif ? (
                            <Box
                                as="img"
                                src={url}
                                alt="preview"
                                objectFit="cover"
                                w="full"
                                h="full"
                                borderRadius="md"
                            />
                        ) : isVideo ? (
                            <Box
                                as="video"
                                src={url}
                                w="full"
                                h="full"
                                borderRadius="md"
                            />
                        ) : (
                            <Box
                                w="full"
                                h="full"
                                bg="gray.700"
                                color="white"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                borderRadius="md"
                                fontSize="xs"
                                textAlign="center"
                                p={1}
                            >
                                {file.name}
                            </Box>
                        )}
                        <IconButton
                            icon={<CloseIcon />}
                            size="xs"
                            position="absolute"
                            top="-6px"
                            right="-6px"
                            borderRadius="full"
                            bg="blackAlpha.700"
                            color="white"
                            onClick={() =>
                                setMediaFiles((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label="Remove file"
                            _hover={{ bg: "blackAlpha.800" }}
                        />
                    </Box>
                );
            })
        );
    };

    return (
        <Box w="full">
            {/* File preview */}
            {mediaFiles.length > 0 && (
                <HStack spacing={2} mb={2} overflowX="auto" px={2}>
                    {previewMedia()}
                </HStack>
            )}

            {/* Textarea + Icons */}
            <Flex
                align="center"
                position="relative"
                border="1px solid #444"
                borderRadius="999px"
                px={4}
                py={2}
                bg="gray.800"
            >
                {/* Emoji bên trái */}
                <Box mr={2}>
                    <Popover placement="top-start" isLazy>
                        <PopoverTrigger>
                            <IconButton
                                icon={<MdOutlineInsertEmoticon />}
                                aria-label="Emoji"
                                size="sm"
                                variant="ghost"
                            />
                        </PopoverTrigger>
                        <PopoverContent w="auto" border="none" boxShadow="lg" bg="transparent" zIndex={10}>
                            <PopoverBody p={0}>
                                <EmojiPicker onEmojiClick={handleEmojiClick} />
                            </PopoverBody>
                        </PopoverContent>
                    </Popover>
                </Box>

                {/* Textarea */}
                <TextareaAutosize
                    minRows={1}
                    maxRows={4}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    style={{
                        width: "100%",
                        background: "transparent",
                        color: "white",
                        fontSize: "1rem",
                        fontFamily: "inherit",
                        border: "none",
                        resize: "none",
                        outline: "none",
                    }}
                    placeholder="Send a message..."
                />

                {/* Icon bên phải */}
                <HStack spacing={1} ml={2}>
                    <IconButton
                        icon={<BsFillImageFill />}
                        size="sm"
                        variant="ghost"
                        onClick={() => imageRef.current.click()}
                        aria-label="Image"
                    />
                    <input
                        type="file"
                        hidden
                        ref={imageRef}
                        multiple
                        accept="image/*,video/*,audio/*"
                        onChange={handleMediaChange}
                    />

                    <Popover placement="top-start" isLazy>
                        <PopoverTrigger>
                            <IconButton
                                icon={<MdOutlineGifBox />}
                                fontWeight={"bold"}
                                size="sm"
                                variant="ghost"
                                aria-label="GIF"
                            />
                        </PopoverTrigger>
                        <PopoverContent w="auto" border="none" boxShadow="lg" bg="transparent" zIndex={10}>
                            <PopoverBody p={0}>
                                <GiphyPicker onGifSelect={handleGifSelect} />
                            </PopoverBody>
                        </PopoverContent>
                    </Popover>

                    <IconButton
                        icon={isSending ? <Spinner size="sm" /> : <IoSendSharp />}
                        size="sm"
                        variant="ghost"
                        color={"blue.400"}
                        isDisabled={!messageText.trim() && mediaFiles.length === 0}
                        onClick={handleSendMessage}
                        aria-label="Send"
                    />
                </HStack>
            </Flex>
        </Box>
    );

};

MessageInput.propTypes = {
    setMessages: PropTypes.func.isRequired,
};

export default MessageInput;
