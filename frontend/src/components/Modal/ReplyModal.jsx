// ReplyModal.jsx
import {
    Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalCloseButton, ModalBody,
    ModalFooter, Button, FormControl, Input
} from "@chakra-ui/react";
import { useState } from "react";
import PropTypes from "prop-types";
import useShowToast from "../../hooks/useShowToast";
import { useRecoilValue } from "recoil";
import userAtom from "../../atoms/userAtom";

const ReplyModal = ({ isOpen, onClose, post, onPostUpdate }) => {
    const [reply, setReply] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const showToast = useShowToast();
    const user = useRecoilValue(userAtom);

    const handleSubmit = async () => {
        if (!reply.trim()) {
            showToast("Error", "Reply cannot be empty", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/posts/reply/${post._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: reply }),
            });

            const data = await res.json();
            if (data.error) {
                showToast("Error", data.error, "error");
                return;
            }

            const updatedPost = {
                ...post,
                replies: [...post.replies, {
                    userId: user._id,
                    text: reply,
                    userProfilePic: user.profilePic,
                    username: user.username
                }]
            };

            onPostUpdate(updatedPost);
            setReply("");
            onClose();
            showToast("Success", "Reply added successfully", "success");
        } catch (error) {
            showToast("Error", error.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Trả lời bài viết</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl>
                        <Input
                            placeholder='Reply goes here...'
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                        />
                    </FormControl>
                </ModalBody>

                <ModalFooter>
                    <Button
                        colorScheme='blue'
                        size="sm"
                        mr={3}
                        isLoading={isSubmitting}
                        onClick={handleSubmit}
                    >
                        Reply
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

ReplyModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    post: PropTypes.object.isRequired,
    onPostUpdate: PropTypes.func.isRequired,
};

export default ReplyModal;
