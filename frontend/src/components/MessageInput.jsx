import {
    Flex,
    Image,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Spinner,
    useDisclosure,
    IconButton,
    Box,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { IoSendSharp } from "react-icons/io5";
import { BsFillImageFill } from "react-icons/bs";
import { MdOutlineInsertEmoticon, MdOutlineGifBox } from "react-icons/md";
import { useOutsideClick } from "@chakra-ui/react-use-outside-click";
import TextareaAutosize from "react-textarea-autosize";
import { useRecoilValue, useSetRecoilState } from "recoil";
import EmojiPicker from "emoji-picker-react";
import PropTypes from "prop-types";
import GiphyPicker from "./GiphyPicker";
import useShowToast from "@hooks/useShowToast";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import api from "../services/api.js";
const MessageInput = ({ setMessages }) => {
    const [messageText, setMessageText] = useState("");
    const [mediaFiles, setMediaFiles] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);

    const imageRef = useRef(null);
    const emojiRef = useRef(null);
    const gifRef = useRef(null);

    const showToast = useShowToast();
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const setConversations = useSetRecoilState(conversationsAtom);
    const { isOpen, onOpen, onClose } = useDisclosure();

    useOutsideClick({
        ref: emojiRef,
        handler: () => setShowEmojiPicker(false),
    });

    useOutsideClick({
        ref: gifRef,
        handler: () => setShowGifPicker(false),
    });

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setMediaFiles(files);
            onOpen();
        }
    };

    const handleGifSelect = async (gifUrl) => {
        try {
            const res = await fetch(gifUrl);
            const blob = await res.blob();
            const file = new File([blob], "gif.gif", { type: "image/gif" });

            setMediaFiles([file]);
            setShowGifPicker(false);
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
            formData.append("recipientId", selectedConversation.userId);
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

    const toggleEmojiPicker = () => setShowEmojiPicker((prev) => !prev);
    const toggleGifPicker = () => setShowGifPicker((prev) => !prev);

    return (
        <Flex gap={2} alignItems="flex-end" position="relative" w="full">
            <Flex gap={1} alignItems="center">
                <IconButton
                    color={"blue.500"}
                    icon={<BsFillImageFill />}
                    onClick={() => imageRef.current.click()}
                    aria-label="Upload media"
                />
                <input
                    type="file"
                    hidden
                    ref={imageRef}
                    multiple
                    accept="image/*,video/*,audio/*"
                    onChange={handleMediaChange}
                />

                <IconButton
                    color={"blue.500"}
                    icon={<MdOutlineInsertEmoticon />}
                    onClick={toggleEmojiPicker}
                    aria-label="Insert emoji"
                />
                <IconButton
                    color={"blue.500"}
                    icon={<MdOutlineGifBox />}
                    onClick={toggleGifPicker}
                    aria-label="Insert gif"
                />
            </Flex>
            {/* Textarea */}
            <Flex flex={1} direction="column" gap={2}>
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
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontSize: "1rem",
                        fontFamily: "inherit",
                        resize: "none",
                        outline: "none",
                    }}
                    placeholder="Type a message"
                />
            </Flex>

            {/* Actions */}
            <Flex alignItems="center" >
                <IconButton
                    color={"blue.500"}
                    icon={isSending ? <Spinner size="sm" /> : <IoSendSharp />}
                    onClick={handleSendMessage}
                    aria-label="Send"
                />

            </Flex>

            {/* Emoji Picker */}
            {showEmojiPicker && (
                <Box ref={emojiRef} position="absolute" bottom="60px" right="60px" zIndex={10}>
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                </Box>
            )}

            {/* Gif Picker */}
            {showGifPicker && (
                <Box ref={gifRef} position="absolute" bottom="60px" right="60px" zIndex={10}>
                    <GiphyPicker onGifSelect={handleGifSelect} />
                </Box>
            )}

            {/* Preview Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Preview Media</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Flex wrap="wrap" gap={2} justifyContent="center">
                            {mediaFiles.map((file, idx) => {
                                const url = URL.createObjectURL(file);
                                const type = file.type.split("/")[0];

                                const handleRemoveMedia = () => {
                                    setMediaFiles((prev) => prev.filter((_, i) => i !== idx));
                                };

                                return (
                                    <Box key={idx} position="relative" boxSize="120px">
                                        <IconButton
                                            size="xs"
                                            icon={<Box as="span" fontSize="16px">✕</Box>}
                                            onClick={handleRemoveMedia}
                                            aria-label="Remove media"
                                            position="absolute"
                                            top="0"
                                            right="0"
                                            zIndex="2"
                                            colorScheme="red"
                                        />
                                        {type === "image" && (
                                            <Image src={url} alt="preview" boxSize="100%" objectFit="cover" borderRadius="md" />
                                        )}
                                        {type === "video" && (
                                            <video src={url} controls width="100%" height="100%" style={{ borderRadius: "8px" }} />
                                        )}
                                        {type === "audio" && (
                                            <audio src={url} controls style={{ width: "100%" }} />
                                        )}
                                    </Box>
                                );
                            })}
                        </Flex>

                        <Flex justifyContent="space-between" mt={4}>
                            <Box>
                                <IconButton
                                    icon={<Box as="span" fontWeight="bold">🗑️</Box>}
                                    aria-label="Remove all media"
                                    size="sm"
                                    colorScheme="red"
                                    onClick={() => setMediaFiles([])}
                                />
                            </Box>

                            {isSending ? (
                                <Spinner size="md" />
                            ) : (
                                <IoSendSharp size={24} cursor="pointer" onClick={handleSendMessage} />
                            )}
                        </Flex>
                    </ModalBody>

                </ModalContent>
            </Modal>
        </Flex>
    );
};

MessageInput.propTypes = {
    setMessages: PropTypes.func.isRequired,
};

export default MessageInput;
