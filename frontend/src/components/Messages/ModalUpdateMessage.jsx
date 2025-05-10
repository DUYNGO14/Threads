import BaseModal from "@components/Modal/BaseModal";
import { Box, Button, IconButton, Input, InputGroup, InputRightElement, Popover, PopoverContent, PopoverTrigger, Text, useOutsideClick } from '@chakra-ui/react';
import { useMessageActions } from "@hooks/useMessageActions";
import useShowToast from "@hooks/useShowToast";
import { useRecoilState } from "recoil";
import { messagesAtom } from "@atoms/messagesAtom";
import { useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { MdOutlineInsertEmoticon } from "react-icons/md";
const ModalUpdateMessage = ({ isOpen, onClose, message }) => {
    const { updateMessage } = useMessageActions();
    const showToast = useShowToast();
    const emojiRef = useRef(null);
    const [selectMessage, setSelectedMessage] = useRecoilState(messagesAtom)
    const [newText, setNewText] = useState(message.text || '');
    const handleUpdate = async () => {
        const res = await updateMessage(message, newText);
        if (res.error) {
            showToast("Error", res.data?.error, "error");
            return;
        }
        setSelectedMessage((prevMessages) =>
            prevMessages.map((msg) => {
                if (msg._id === message._id) {
                    return { ...msg, text: newText };
                }
                return msg;
            })
        );
        onClose();
    }
    const footer = (
        <Button colorScheme="red" mr={3} onClick={handleUpdate}>
            Update
        </Button>
    );
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Edit Message" footer={footer}>
            <InputGroup m={4} maxW="80%" mx="auto">
                <Input
                    type="text"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    pr="4.5rem"
                />
                <InputRightElement>
                    <Popover placement="right-end" isLazy trigger="click">
                        <PopoverTrigger>
                            <IconButton
                                icon={<MdOutlineInsertEmoticon />}
                                size="sm"
                                variant="ghost"
                                aria-label="Emoji"
                            />
                        </PopoverTrigger>
                        <PopoverContent width="auto" bg="white" boxShadow="md" borderRadius="md" p={2}>
                            <EmojiPicker
                                height={400}
                                width={300}
                                onEmojiClick={(emojiData) => {
                                    setNewText((prev) => prev + emojiData.emoji);
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                </InputRightElement>
            </InputGroup>
        </BaseModal>
    )
}

export default ModalUpdateMessage