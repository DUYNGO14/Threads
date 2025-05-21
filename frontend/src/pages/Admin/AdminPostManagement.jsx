import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useRecoilState } from "recoil";
import postsAtom from "@atoms/postsAtom";
import api from '@services/api';
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Box, Button, Flex, IconButton, Select, Table, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue, useDisclosure } from '@chakra-ui/react';
import { DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import UserPost from '../../components/UserPost';
const AdminPostManagement = props => {
    const [posts, setPosts] = useRecoilState(postsAtom);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [status, setStatus] = useState("");
    const cancelRef = useRef();
    const bgColor = useColorModeValue('gray.100', 'gray.700');
    const cardBg = useColorModeValue('white', 'gray.800');
    const [statusChangeTimers, setStatusChangeTimers] = useState({});
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/posts?status=${status}&page=${page}&limit=10`);
            setPosts(res.data.data.posts);
            setTotalPages(res.data.data.totalPages);
        } catch (err) {
            console.error("Post API error:", err);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        fetchData();
    }, [page, status]);
    const handleView = (post) => {
        setSelectedPost(post);
        onOpen();
    };
    const handleStatusChange = (post, newStatus) => {
        if (statusChangeTimers[post._id]) {
            clearTimeout(statusChangeTimers[post._id]);
        }
        const timerId = setTimeout(async () => {
            try {
                const res = await api.put(`/api/admin/post/${post._id}/status`, { status: newStatus });
                if (res.status === 200) {
                    fetchData();
                }
            } catch (error) {
                console.error('Error updating status:', error);
            }
        }, 500);
        setStatusChangeTimers((prev) => ({
            ...prev,
            [post._id]: timerId,
        }));
    }
    return (
        <Box p={4} width="100%" mx="auto">
            <Text fontSize="3xl" mb={6} fontWeight="bold" textAlign="center">
                Posts Management
            </Text>
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
                            placeholder="Filter by status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            w="200px"
                        >
                            <option value="pending">Pending</option>
                            <option value="pending_review">Reviewed</option>
                            <option value="approved">Resolved</option>
                            <option value="rejected">Rejected</option>
                        </Select>
                    </Flex>
                    <Button
                        onClick={() => {
                            setStatus('');
                        }}
                        colorScheme="gray"
                        variant="outline"
                    >
                        Clear Filters
                    </Button>
                </Flex>
            </Box>
            <Box p={4} overflowX="auto" bg={cardBg} rounded="xl" shadow="md" minW="full">
                <Table variant="simple" minW="800px" size="sm"  >
                    <Thead>
                        <Tr>
                            <Th>STT</Th>
                            <Th>UserName Owner</Th>
                            <Th>Content</Th>
                            <Th>Status</Th>
                            <Th>Created At</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {loading && <Tr><Td colSpan={6}>Loading...</Td></Tr>}
                        {!loading && posts.length === 0 && <Tr><Td colSpan={6} textAlign="center" py={4} fontWeight="bold" fontSize="xl">No posts found</Td></Tr>}
                        {posts.map((post, index) => (
                            <Tr key={post._id} >
                                <Td>{index + 1}</Td>
                                <Td>{post.postedBy?.username}</Td>
                                <Td maxW="300px">{post.text}</Td>
                                <Td><Select
                                    w={"110px"}
                                    value={post.status}
                                    size="sm"
                                    variant="filled"
                                    color="white"
                                    bg={
                                        post.status === 'pending'
                                            ? 'yellow'
                                            : post.status === 'pending_review'
                                                ? 'blue.700'
                                                : post.status === 'approved' ? 'green' : 'red'
                                    }
                                    borderColor={
                                        post.status === 'pending'
                                            ? 'yellow'
                                            : post.status === 'pending_review'
                                                ? 'blue'
                                                : post.status === 'approved' ? 'green' : 'red'
                                    }
                                    borderRadius="md"
                                    fontWeight="bold"
                                    onChange={(e) => handleStatusChange(post, e.target.value)}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="pending_review">Reviewed</option>
                                    <option value="approved">Resolved</option>
                                    <option value="rejected">Rejected</option>
                                </Select></Td>
                                <Td>{new Date(post.createdAt).toLocaleDateString()}</Td>
                                <Td>
                                    <IconButton
                                        icon={<ViewIcon />}
                                        size="sm"
                                        mr={2}
                                        variant="outline"
                                        colorScheme="blue"
                                        aria-label="View"
                                        onClick={() => handleView(post)}
                                    />
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
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
            {isOpen && (
                <UserPost isOpen={isOpen} onClose={onClose} post={selectedPost} />)}
        </Box>
    )
}

AdminPostManagement.propTypes = {}

export default AdminPostManagement