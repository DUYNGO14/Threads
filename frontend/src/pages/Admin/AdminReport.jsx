import React from "react";
import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Button,
    Heading,
    Text,
    HStack,
} from "@chakra-ui/react";

const AdminReport = () => {
    // Dữ liệu mẫu cho danh sách bài viết bị report
    const reports = [
        {
            id: 1,
            postTitle: "How to learn React",
            reporter: "user123",
            reason: "Spam content",
            reportedAt: "2025-05-01",
        },
        {
            id: 2,
            postTitle: "JavaScript Tips",
            reporter: "user456",
            reason: "Inappropriate language",
            reportedAt: "2025-04-30",
        },
        {
            id: 3,
            postTitle: "CSS Tricks",
            reporter: "user789",
            reason: "Copyright infringement",
            reportedAt: "2025-04-29",
        },
    ];

    const handleViewPost = (postId) => {
        console.log("Viewing post:", postId);
        // Thêm logic để xem chi tiết bài viết
    };

    const handleDeletePost = (postId) => {
        console.log("Deleting post:", postId);
        // Thêm logic để xóa bài viết
    };

    return (
        <Box p={6}>
            <Heading size="lg" mb={4}>
                Reported Posts
            </Heading>
            {reports.length > 0 ? (
                <TableContainer>
                    <Table variant="striped" colorScheme="gray">
                        <Thead>
                            <Tr>
                                <Th>#</Th>
                                <Th>Post Title</Th>
                                <Th>Reporter</Th>
                                <Th>Reason</Th>
                                <Th>Reported At</Th>
                                <Th>Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {reports.map((report, index) => (
                                <Tr key={report.id}>
                                    <Td>{index + 1}</Td>
                                    <Td>{report.postTitle}</Td>
                                    <Td>{report.reporter}</Td>
                                    <Td>{report.reason}</Td>
                                    <Td>{report.reportedAt}</Td>
                                    <Td>
                                        <HStack spacing={2}>
                                            <Button
                                                size="sm"
                                                colorScheme="blue"
                                                onClick={() => handleViewPost(report.id)}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                colorScheme="red"
                                                onClick={() => handleDeletePost(report.id)}
                                            >
                                                Delete
                                            </Button>
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>
            ) : (
                <Text>No reported posts found.</Text>
            )}
        </Box>
    );
};

export default AdminReport;