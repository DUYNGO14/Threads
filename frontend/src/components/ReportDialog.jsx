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

const ReportDialog = ({ isOpen, onClose, onSubmit }) => {
    const cancelRef = useRef();
    const [selectedReason, setSelectedReason] = useState("");
    const [customReason, setCustomReason] = useState("");

    const handleSubmit = () => {
        const reasonToSubmit = selectedReason === "Other" ? customReason : selectedReason;
        if (!selectedReason) {
            return onSubmit(null, selectedReason);
        }
        onSubmit(reasonToSubmit, selectedReason);
        setSelectedReason("");
        setCustomReason("");
    };

    return (
        <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">Report Post</AlertDialogHeader>
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
                        <Button ref={cancelRef} onClick={onClose}>Cancel</Button>
                        <Button colorScheme="red" onClick={handleSubmit} ml={3}>Report</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};

ReportDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
};

export default ReportDialog;
