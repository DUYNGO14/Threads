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
    Flex,
} from "@chakra-ui/react";
import { IoSendSharp } from "react-icons/io5";
import { BsFillImageFill } from "react-icons/bs";
import { MdOutlineInsertEmoticon, MdOutlineGifBox } from "react-icons/md";
import TextareaAutosize from "react-textarea-autosize";
import PropTypes from "prop-types";
import EmojiPicker from "emoji-picker-react";
import GiphyPicker from "./GiphyPicker";
import MediaPreviewList from "./Messages/MediaPreviewList.jsx";
import useMediaHandler from "@hooks/useMediaHandler";
import useEmojiHandler from "@hooks/useEmojiHandler";
import useSendMessage from "@hooks/useSendMessage";

const MessageInput = ({ setMessages }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const {
        mediaFiles,
        setMediaFiles,
        imageRef,
        handleMediaChange,
        handleGifSelect,
    } = useMediaHandler(onOpen);

    const {
        messageText,
        setMessageText,
        handleEmojiClick,
        resetMessageText,
    } = useEmojiHandler();

    const resetInput = () => {
        resetMessageText();
        setMediaFiles([]);
        onClose();
    };

    const { handleSendMessage, isSending } = useSendMessage(
        setMessages,
        resetInput,
        () => messageText,
        () => mediaFiles
    );

    return (
        <Box w="full">
            {mediaFiles.length > 0 && (
                <HStack spacing={2} mb={2} overflowX="auto" px={2}>
                    <MediaPreviewList mediaFiles={mediaFiles} setMediaFiles={setMediaFiles} />
                </HStack>
            )}

            <Flex
                align="center"
                border="1px solid #444"
                borderRadius="999px"
                px={4}
                py={2}
                bg="gray.800"
            >
                {/* Emoji */}
                <Box mr={2}>
                    <Popover placement="top-start" isLazy>
                        <PopoverTrigger>
                            <IconButton
                                icon={<MdOutlineInsertEmoticon />}
                                aria-label="Open emoji picker"
                                size="sm"
                                variant="ghost"
                            />
                        </PopoverTrigger>
                        <PopoverContent w="auto" border="none" bg="transparent" zIndex={10}>
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
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
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

                {/* Media & Send Buttons */}
                <HStack spacing={1} ml={2}>
                    <IconButton
                        icon={<BsFillImageFill />}
                        size="sm"
                        variant="ghost"
                        onClick={() => imageRef.current.click()}
                        aria-label="Upload media"
                        isDisabled={isSending}
                    />
                    <input
                        type="file"
                        hidden
                        ref={imageRef}
                        multiple
                        accept="image/*,video/*,audio/*"
                        onChange={handleMediaChange}
                        disabled={isSending}
                    />

                    <Popover placement="top-start" isLazy>
                        <PopoverTrigger>
                            <IconButton
                                icon={<MdOutlineGifBox />}
                                size="sm"
                                variant="ghost"
                                aria-label="Open GIF picker"
                            />
                        </PopoverTrigger>
                        <PopoverContent w="auto" border="none" bg="transparent" zIndex={10}>
                            <PopoverBody p={0}>
                                <GiphyPicker onGifSelect={handleGifSelect} />
                            </PopoverBody>
                        </PopoverContent>
                    </Popover>

                    <IconButton
                        icon={isSending ? <Spinner size="sm" /> : <IoSendSharp />}
                        size="sm"
                        variant="ghost"
                        color="blue.400"
                        onClick={handleSendMessage}
                        aria-label="Send message"
                        isDisabled={!messageText.trim() && mediaFiles.length === 0}
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
