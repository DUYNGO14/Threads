import React, { useEffect, useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Text,
    Avatar,
    Image,
    Box,
    Flex,
    Badge,
    Button,
    useColorModeValue,
} from '@chakra-ui/react';
import api from '@services/api';
import Carousels from './Carousels';
import useShowToast from '@hooks/useShowToast';
const ReportDetailModal = ({ isOpen, onClose, report }) => {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const showToast = useShowToast();
    const bg = useColorModeValue('gray.100', 'gray.dark');
    useEffect(() => {
        const fetchDetail = async () => {
            if (!report) return;
            setLoading(true);
            try {
                if (report.type === 'post') {
                    const res = await api.get(`/api/posts/${report.postId._id}`);
                    setDetail(res.data.post);
                } else if (report.type === 'comment') {
                    const res = await api.get(`/api/replies/${report.commentId._id}`);
                    setDetail(res.data);
                } else {
                    setDetail(report.userId);
                }
            } catch (err) {
                console.error('Failed to fetch detail:', err);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) fetchDetail();
    }, [isOpen, report]);
    if (!report) return null;
    const handleDelete = async (type) => {
        try {
            if (type === 'post') {
                const res = await api.delete(`/api/posts/${detail._id}`);
                const data = await res.data;
                if (res.status === 200) {
                    showToast("Success", data.message, "success");
                    onClose();
                }
            } else if (type === 'comment') {
                console.log(detail);
                const res = await api.delete(`/api/replies/${detail._id}`);
                const data = await res.data;
                if (res.status === 200) {
                    showToast("Success", data.message, "success");
                    onClose();
                }
            }
        } catch (err) {
            const errormsg = err.response?.data?.message || 'Failed to delete!';
            showToast("Error", errormsg, "error");
        }
    }
    const reportedUser =
        report.type === 'comment'
            ? report.commentId?.userId
            : report.type === 'post'
                ? report.postId?.postedBy
                : report.userId;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent bg={bg}>
                <ModalHeader>Report Details</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Flex align="center" mb={4}>
                        <Avatar name={reportedUser?.username} mr={3} src={reportedUser?.profilePic} />
                        <Box>
                            <Text fontWeight="bold">{reportedUser?.username}</Text>
                            <Badge colorScheme="purple">{report.type}</Badge>
                        </Box>
                    </Flex>

                    <Text mb={2} fontWeight="bold">
                        Reason: {report.reason}
                    </Text>
                    {!detail && <Box>
                        <Text fontWeight="bold" mb={2}>
                            {report.type} not found
                        </Text>
                    </Box>}
                    {report.type === 'post' && report.postId && detail && (
                        <Box>
                            <Text mb={2}>Caption: {detail.text}</Text>
                            {detail.media && detail.media.length > 0 && (

                                <Carousels medias={detail.media} />
                            )}
                            <Button my={2} onClick={() => handleDelete('post')} bgColor={'red.500'} color={'white'} _hover={{ bgColor: 'red.700' }}>Delete Post</Button>
                        </Box>

                    )}

                    {report.type === 'comment' && report.commentId && (
                        <>
                            <Box>
                                <Text fontWeight="bold" mb={2}>
                                    Comment Content: {report.commentId.text}
                                </Text>
                                <Button my={2} onClick={() => handleDelete('comment')} bgColor={'red.500'} color={'white'} _hover={{ bgColor: 'red.700' }}>Delete Comment</Button>
                            </Box>
                        </>
                    )}

                    {report.type === 'user' && report.userId && (
                        <Box>
                            <Text fontWeight="bold" mb={2}>
                                User Info:
                            </Text>
                            <Text>Email: {report.userId.email}</Text>
                            <Button onClick={() => window.open(`/users/${report.userId._id}`)}>View User</Button>
                            <Button onClick={() => window.open(`/posts/${detail._id}`)}>Delete Post</Button>
                        </Box>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ReportDetailModal;
