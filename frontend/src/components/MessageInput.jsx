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
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { IoSendSharp } from "react-icons/io5";
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
            formData.append("conversationId", selectedConversation._id); // 🔁 thay recipientId

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

    return (
        <Box position="relative" w="full">
            {/* Emoji bên trái */}
            <Box position="absolute" left="8px" top="50%" transform="translateY(-50%)" zIndex="1">
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

            {/* Icon bên phải */}
            <HStack
                spacing={1}
                position="absolute"
                right="8px"
                top="50%"
                transform="translateY(-50%)"
                zIndex="1"
            >
                <IconButton
                    icon={<BsFillImageFill />}
                    size="md"
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
                            size="md"
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
                    color={"blue.500"}
                    isDisabled={!messageText.trim() && mediaFiles.length === 0}
                    onClick={handleSendMessage}
                    aria-label="Send"
                />
            </HStack>

            {/* Textarea chính */}
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
                    padding: "8px 100px 8px 40px", // padding left + right để chừa chỗ icon
                    border: "1px solid #ccc",
                    borderRadius: "999px",
                    fontSize: "1rem",
                    fontFamily: "inherit",
                    resize: "none",
                    outline: "none",
                }}
                placeholder="Type a message"
            />
        </Box>

    );
};

MessageInput.propTypes = {
    setMessages: PropTypes.func.isRequired,
};

export default MessageInput;
