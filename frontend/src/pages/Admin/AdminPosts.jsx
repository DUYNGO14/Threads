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

const AdminPosts = () => {
    // Dữ liệu mẫu cho danh sách bài post
    const posts = [
        { id: 1, title: "How to learn React", author: "user123", createdAt: "2025-05-01" },
        { id: 2, title: "JavaScript Tips", author: "user456", createdAt: "2025-04-30" },
        { id: 3, title: "CSS Tricks", author: "user789", createdAt: "2025-04-29" },
    ];

    const handleEditPost = (postId) => {
        console.log("Editing post:", postId);
        // Thêm logic để chỉnh sửa bài viết
    };

    const handleDeletePost = (postId) => {
        console.log("Deleting post:", postId);
        // Thêm logic để xóa bài viết
    };

    return (
        <Box p={6}>
            <Heading size="lg" mb={4}>
                Posts
            </Heading>
            <TableContainer>
                <Table variant="striped" colorScheme="gray">
                    <Thead>
                        <Tr>
                            <Th>#</Th>
                            <Th>Title</Th>
                            <Th>Author</Th>
                            <Th>Created At</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {posts.map((post, index) => (
                            <Tr key={post.id}>
                                <Td>{index + 1}</Td>
                                <Td>{post.title}</Td>
                                <Td>{post.author}</Td>
                                <Td>{post.createdAt}</Td>
                                <Td>
                                    <HStack spacing={2}>
                                        <Button
                                            size="sm"
                                            colorScheme="blue"
                                            onClick={() => handleEditPost(post.id)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            colorScheme="red"
                                            onClick={() => handleDeletePost(post.id)}
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

export default AdminPosts;