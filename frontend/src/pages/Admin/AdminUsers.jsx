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
    HStack,
} from "@chakra-ui/react";

const AdminUsers = () => {
    // Dữ liệu mẫu cho danh sách người dùng
    const users = [
        { id: 1, username: "user123", email: "user123@example.com", joinedAt: "2025-01-01" },
        { id: 2, username: "user456", email: "user456@example.com", joinedAt: "2025-02-15" },
        { id: 3, username: "user789", email: "user789@example.com", joinedAt: "2025-03-10" },
    ];

    const handleViewUser = (userId) => {
        console.log("Viewing user:", userId);
        // Thêm logic để xem chi tiết người dùng
    };

    const handleDeleteUser = (userId) => {
        console.log("Deleting user:", userId);
        // Thêm logic để xóa người dùng
    };

    return (
        <Box p={6}>
            <Heading size="lg" mb={4}>
                Users
            </Heading>
            <TableContainer>
                <Table variant="striped" colorScheme="gray">
                    <Thead>
                        <Tr>
                            <Th>#</Th>
                            <Th>Username</Th>
                            <Th>Email</Th>
                            <Th>Joined At</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {users.map((user, index) => (
                            <Tr key={user.id}>
                                <Td>{index + 1}</Td>
                                <Td>{user.username}</Td>
                                <Td>{user.email}</Td>
                                <Td>{user.joinedAt}</Td>
                                <Td>
                                    <HStack spacing={2}>
                                        <Button
                                            size="sm"
                                            colorScheme="blue"
                                            onClick={() => handleViewUser(user.id)}
                                        >
                                            View
                                        </Button>
                                        <Button
                                            size="sm"
                                            colorScheme="red"
                                            onClick={() => handleDeleteUser(user.id)}
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
        </Box>
    );
};

export default AdminUsers;