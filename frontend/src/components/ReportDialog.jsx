import {
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    Button,
    Select,
    Input
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import PropTypes from "prop-types";
import useShowToast from "../hooks/useShowToast";
import { useRecoilValue } from "recoil";
import useReport from "@hooks/useReport";
import userAtom from "../atoms/userAtom";

const ReportDialog = ({ isOpen, onClose, post, postedBy, type = "post", comment }) => {
    const cancelRef = useRef();
    const showToast = useShowToast();
    const { createReport } = useReport();
    const currentUser = useRecoilValue(userAtom);

    const [selectedReason, setSelectedReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const submitReport = async (reasonToSubmit) => {
        if (!reasonToSubmit) {
            showToast("Error", "Please select a reason.", "error");
            return;
        }

        try {
            setIsLoading(true);
            const result = type === "post" ? await createReport({
                reportedBy: currentUser._id,
                postId: post._id,
                reason: reasonToSubmit,
                type: "post",
                userId: postedBy._id
            }) : await createReport({
                reportedBy: currentUser._id,
                commentId: comment._id,
                reason: reasonToSubmit,
                type: "comment",
                userId: comment.userId._id
            })

            if (!result) {
                showToast("Error", "Something went wrong.", "error");
                return;
            }

            showToast("Success", "Report submitted successfully.", "success");
            onClose();
            setSelectedReason("");
            setCustomReason("");
        } catch (error) {
            showToast("Error", error.message || "An error occurred.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = () => {
        const reasonToSubmit = selectedReason === "Other" ? customReason.trim() : selectedReason;
        submitReport(reasonToSubmit);
    };

    const isReportDisabled =
        !selectedReason || (selectedReason === "Other" && !customReason.trim());

    return (
        <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        Report {type === "post" ? "Post" : "Comment"}
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        <Select
                            placeholder="Select a reason"
                            value={selectedReason}
                            onChange={(e) => {
                                const reason = e.target.value;
                                setSelectedReason(reason);
                                if (reason !== "Other") setCustomReason("");
                            }}
                        >
                            <option value="Inappropriate language">Inappropriate language</option>
                            <option value="Spam or misleading">Spam or misleading</option>
                            <option value="Harassment or bullying">Harassment or bullying</option>
                            <option value="Other">Other</option>
                        </Select>

                        {selectedReason === "Other" && (
                            <Input
                                mt={2}
                                placeholder="Please specify the reason"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                            />
                        )}
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="red"
                            onClick={handleSubmit}
                            ml={3}
                            isLoading={isLoading}
                            isDisabled={isReportDisabled}
                        >
                            Report
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};

ReportDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    post: PropTypes.object.isRequired,
    postedBy: PropTypes.object.isRequired,
};

export default ReportDialog;
