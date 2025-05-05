import React, { useEffect, useState, useRef } from 'react';
import {
    Box,
    Avatar,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    Badge,
    Flex,
    Text,
    IconButton,
    Select,
    useDisclosure,
    useColorModeValue,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    TableContainer,
} from '@chakra-ui/react';
import { DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import api from '@services/api';
import useShowToast from '@hooks/useShowToast';
import { useRecoilState } from 'recoil';
import reportsAtom from '@atoms/reportAtom';
import ReportDetailModal from '@components/ReportDetailModal';

const AdminUserManagement = () => {
    const [page, setPage] = useState(1);
    const [selectedReport, setSelectedReport] = useState(null);
    const [totalPages, setTotalPages] = useState(1);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [listReport, setListReport] = useRecoilState(reportsAtom);
    const showToast = useShowToast();
    const bgColor = useColorModeValue('gray.100', 'gray.700');
    const cardBg = useColorModeValue('white', 'gray.800');
    const [statusChangeTimers, setStatusChangeTimers] = useState({});
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    // Modal xác nhận xoá
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState(null);
    const cancelRef = useRef();

    const fetchReports = async () => {
        try {
            const res = await api.get(`/api/admin/reports?page=${page}&limit=5`);
            setListReport(res.data.data);
            setTotalPages(res.data.pages);
        } catch (error) {
            console.error('Error fetching reports:', error);
            showToast('Error', 'Failed to fetch reports', 'error');
        }
    };
    const filteredReports = listReport.filter((report) => {
        const matchType = filterType ? report.type === filterType : true;
        const matchStatus = filterStatus ? report.status === filterStatus : true;
        return matchType && matchStatus;
    });
    useEffect(() => {
        fetchReports();
    }, [page]);

    useEffect(() => {
        return () => {
            Object.values(statusChangeTimers).forEach(clearTimeout);
        };
    }, [statusChangeTimers]);

    const handleView = (report) => {
        setSelectedReport(report);
        onOpen();
    };

    const openDeleteDialog = (report) => {
        setReportToDelete(report);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const res = await api.delete(`/api/reports/${reportToDelete._id}`);
            if (res.status === 200) {
                showToast('Success', res.data.message, 'success');
                fetchReports();
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            showToast('Error', 'Failed to delete report', 'error');
        } finally {
            setIsDeleteDialogOpen(false);
            setReportToDelete(null);
        }
    };

    const handleStatusChange = (report, newStatus) => {
        if (statusChangeTimers[report._id]) {
            clearTimeout(statusChangeTimers[report._id]);
        }

        const timerId = setTimeout(async () => {
            try {
                const res = await api.put(`/api/reports/${report._id}/status`, { status: newStatus });
                if (res.status === 200) {
                    fetchReports();
                }
            } catch (error) {
                console.error('Error updating status:', error);
                showToast('Error', 'Failed to update status', 'error');
            }
        }, 500);

        setStatusChangeTimers((prev) => ({
            ...prev,
            [report._id]: timerId,
        }));
    };

    return (
        <Box p={4} width="100%" mx="auto">
            <Text fontSize="3xl" mb={6} fontWeight="bold" textAlign="center">
                Report Management
            </Text>

            {/* Bộ lọc */}
            <Box
                mb={6}
                p={4}
                bg={cardBg}
                rounded="md"
                shadow="sm"
                borderWidth="1px"
                borderColor={useColorModeValue('gray.200', 'gray.600')}
            >
                <Flex gap={4} wrap="wrap" justify="space-between" align="center">
                    <Flex gap={4} wrap="wrap">
                        <Select
                            placeholder="Filter by type"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            w="200px"
                        >
                            <option value="post">Post</option>
                            <option value="comment">Comment</option>
                            <option value="user">User</option>
                        </Select>

                        <Select
                            placeholder="Filter by status"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            w="200px"
                        >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="resolved">Resolved</option>
                        </Select>
                    </Flex>
                    <Button
                        onClick={() => {
                            setFilterType('');
                            setFilterStatus('');
                        }}
                        colorScheme="gray"
                        variant="outline"
                    >
                        Clear Filters
                    </Button>
                </Flex>
            </Box>

            {/* Bảng danh sách */}
            <Box p={4} overflowX="auto" bg={cardBg} rounded="xl" shadow="md" minW="full">
                <Table variant="simple" minW="800px">
                    <Thead>
                        <Tr>
                            <Th>Annunciator</Th>
                            <Th>Reported Person</Th>
                            <Th>Reason</Th>
                            <Th>Type</Th>
                            <Th>Status</Th>
                            <Th display={{ base: 'none', md: 'table-cell' }}>Created</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredReports.length === 0 ? (
                            <Tr>
                                <Td colSpan={7}>
                                    <Flex justify="center" align="center" h="200px">
                                        <Text fontStyle="italic" color="gray.500">
                                            No reports found.
                                        </Text>
                                    </Flex>
                                </Td>
                            </Tr>
                        ) : (
                            filteredReports.map((report) => (
                                <Tr key={report._id} _hover={{ bg: bgColor }}>
                                    <Td>
                                        <Flex align="center">
                                            <Avatar size="sm" name={report.reportedBy?.username} src={report.reportedBy?.profilePic} mr={2} />
                                            <Text>{report.reportedBy?.username}</Text>
                                        </Flex>
                                    </Td>
                                    <Td>
                                        <Flex align="center">
                                            <Avatar
                                                size="sm"
                                                name={
                                                    report.type === 'comment'
                                                        ? report.commentId?.userId?.username
                                                        : report.type === 'post'
                                                            ? report.postId?.postedBy?.username
                                                            : report.userId?.username
                                                }
                                                src={
                                                    report.type === 'comment'
                                                        ? report.commentId?.userId?.profilePic
                                                        : report.type === 'post'
                                                            ? report.postId?.postedBy?.profilePic
                                                            : report.userId?.profilePic
                                                }
                                                mr={2}
                                            />
                                            <Text>
                                                {report.type === 'comment'
                                                    ? report.commentId?.userId?.username
                                                    : report.type === 'post'
                                                        ? report.postId?.postedBy?.username
                                                        : report.userId?.username}
                                            </Text>
                                        </Flex>
                                    </Td>
                                    <Td>{report.reason}</Td>
                                    <Td>
                                        <Badge colorScheme={report.type === 'post' ? 'blue' : 'purple'} px={2} rounded="full">
                                            {report.type}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <Select
                                            value={report.status}
                                            size="sm"
                                            bg={useColorModeValue(
                                                report.status === 'pending'
                                                    ? 'yellow.300'
                                                    : report.status === 'reviewed'
                                                        ? 'blue.300'
                                                        : 'green.300',
                                                report.status === 'pending'
                                                    ? 'yellow.600'
                                                    : report.status === 'reviewed'
                                                        ? 'blue.600'
                                                        : 'green.600'
                                            )}
                                            borderColor={useColorModeValue(
                                                report.status === 'pending'
                                                    ? 'yellow.500'
                                                    : report.status === 'reviewed'
                                                        ? 'blue.500'
                                                        : 'green.500',
                                                report.status === 'pending'
                                                    ? 'yellow.700'
                                                    : report.status === 'reviewed'
                                                        ? 'blue.700'
                                                        : 'green.700'
                                            )}
                                            borderRadius="md"
                                            fontWeight="bold"
                                            onChange={(e) => handleStatusChange(report, e.target.value)}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="reviewed">Reviewed</option>
                                            <option value="resolved">Resolved</option>
                                        </Select>
                                    </Td>
                                    <Td display={{ base: 'none', md: 'table-cell' }}>
                                        {new Date(report.createdAt).toLocaleDateString()}
                                    </Td>
                                    <Td>
                                        <IconButton
                                            icon={<ViewIcon />}
                                            size="sm"
                                            mr={2}
                                            variant="outline"
                                            colorScheme="blue"
                                            aria-label="View"
                                            onClick={() => handleView(report)}
                                        />
                                        <IconButton
                                            icon={<DeleteIcon />}
                                            size="sm"
                                            variant="outline"
                                            colorScheme="red"
                                            aria-label="Delete"
                                            onClick={() => openDeleteDialog(report)}
                                        />
                                    </Td>
                                </Tr>
                            ))
                        )}
                    </Tbody>
                </Table>
            </Box>


            {/* Phân trang */}
            <Flex mt={6} justify="center" align="center" gap={4} flexWrap="wrap">
                <Button onClick={() => setPage((p) => Math.max(1, p - 1))} isDisabled={page === 1}>
                    Previous
                </Button>
                <Text fontWeight="medium">
                    Page {page} of {totalPages}
                </Text>
                <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} isDisabled={page === totalPages}>
                    Next
                </Button>
            </Flex>

            {/* Modal chi tiết & xoá */}
            <ReportDetailModal isOpen={isOpen} onClose={onClose} report={selectedReport} />
            <AlertDialog
                isOpen={isDeleteDialogOpen}
                leastDestructiveRef={cancelRef}
                onClose={() => setIsDeleteDialogOpen(false)}

            >
                <AlertDialogOverlay>
                    <AlertDialogContent bg={useColorModeValue('gray.100', 'gray.dark')}>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold" textAlign="center">
                            Delete Report
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure you want to delete this report? This action cannot be undone.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>

    );
};

export default AdminUserManagement;
