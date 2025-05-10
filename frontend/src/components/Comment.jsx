import {
    Avatar, Box, Divider, Flex, Menu, MenuButton, MenuItem, MenuList,
    Portal, Text, useColorModeValue,
} from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import { CgMoreO } from "react-icons/cg";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import DeleteReplyModal from "./Modal/DeleteReplyModal";
import EditReplyModal from "./Modal/EditReplyModal";
import useReplyModalManager from "@hooks/useReplyModalManager";
import useReport from "@hooks/useReport";
import useShowToast from "@hooks/useShowToast";
import ReportDialog from "./ReportDialog";

const Comment = ({ reply, lastReply, postId, currentUser, onReplyUpdate, onReplyDelete }) => {
    const isMyComment = currentUser?.username === reply.username;
    const {
        isOpen,
        modalType,
        openModal,
        closeModal,
    } = useReplyModalManager();
    const showToast = useShowToast();
    const { error, createReport } = useReport();
    const [isReportOpen, setIsReportOpen] = useState(false);

    const openReportDialog = () => setIsReportOpen(true);

    const submitReport = async (reasonToSubmit) => {
        if (!reasonToSubmit) {
            showToast("Error", "Please select a reason.", "error");
            return;
        }
        try {
            await createReport({
                reportedBy: currentUser._id,
                commentId: reply._id,
                reason: reasonToSubmit,
                type: "comment",
                userId: reply.userId
            });
            if (error) {
                showToast("Error", error, "error");
                return;
            };
            showToast("Success", "Report submitted successfully.", "success");
            setIsReportOpen(false);
        } catch (error) {
            showToast("Error", error.message, "error");
        }
    };

    return (
        <>
            <Flex gap={4} py={2} my={2} w={"full"}>
                <Avatar src={reply.userProfilePic} size={"sm"} />
                <Flex gap={1} w={"full"} flexDirection={"column"}>
                    <Flex w={"full"} justifyContent={"space-between"} alignItems={"center"}>
                        <Link to={`/${reply.username}`}>
                            <Text fontSize='sm' fontWeight='bold'>{reply.username}</Text>
                        </Link>
                        <Text fontSize={"xs"} color={"gray.500"}>
                            {reply.createdAt ? formatDistanceToNow(new Date(reply.createdAt)) : "Just now"} ago
                        </Text>
                    </Flex>
                    <Text>{reply.text}</Text>
                </Flex>
                <Flex>
                    <Box className='icon-container'>
                        <Menu placement="bottom-start">
                            <MenuButton>
                                <CgMoreO size={24} cursor={"pointer"} />
                            </MenuButton>
                            <Portal>
                                <MenuList bg={useColorModeValue("white", "gray.dark")}>
                                    {isMyComment && (
                                        <>
                                            <MenuItem onClick={() => openModal("edit")}>Edit</MenuItem>
                                            <MenuItem onClick={() => openModal("delete")}>Delete</MenuItem>
                                        </>
                                    )}
                                    {
                                        !isMyComment && (
                                            <MenuItem onClick={openReportDialog}>Report</MenuItem>
                                        )
                                    }
                                </MenuList>
                            </Portal>
                        </Menu>
                    </Box>
                </Flex>
            </Flex>

            {!lastReply && <Divider />}

            {isOpen && modalType === "edit" && <EditReplyModal
                isOpen={isOpen && modalType === "edit"}
                onClose={closeModal}
                postId={postId}
                replyId={reply._id}
                initialText={reply.text}
                onSuccess={onReplyUpdate}
            />}

            {isOpen && modalType === "delete" && <DeleteReplyModal
                isOpen={isOpen && modalType === "delete"}
                onClose={closeModal}
                postId={postId}
                replyId={reply._id}
                onSuccess={onReplyDelete}
            />}

            {/* Popup chọn lý do report */}
            {isReportOpen && <ReportDialog
                type="comment"
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                onSubmit={submitReport}
                comment={reply}
            />}
        </>
    );
};

export default Comment;
