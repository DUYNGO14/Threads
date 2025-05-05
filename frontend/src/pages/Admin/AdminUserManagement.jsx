import React, { useEffect, useState } from 'react';
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
    useDisclosure,
    useColorMode,
    useColorModeValue,
} from '@chakra-ui/react';
import { LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { FaGoogle, FaFacebook, FaUser } from 'react-icons/fa';
import api from '@services/api';
import useShowToast from '@hooks/useShowToast';
import UserDetailModal from '@components-admin/UserDetailModal';
import { useRecoilState } from 'recoil';
import { listUserAtom } from '@atoms/userAtom';
import useToggleBlockUser from '@hooks/useToggleBlockUser';
const AdminUserManagement = () => {
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [listUser, setListUser] = useRecoilState(listUserAtom);
    const showToast = useShowToast();
    const toggleBlockUser = useToggleBlockUser();
    const bgColor = useColorModeValue('gray.100', 'gray.700');
    const handleBlockUser = (userId) => {
        console.log(userId);
        toggleBlockUser(userId);
    }
    const fetchUsers = async () => {
        try {
            const res = await api.get(`/api/admin/users?page=${page}&limit=5`);
            setListUser(res.data.data.users);
            setTotalPages(res.data.data.totalPages);
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast('Error', 'Failed to fetch users', 'error');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const handleViewUser = (user) => {
        setSelectedUser(user);
        onOpen();
    };

    return (
        <Box p={4} width="100%" mx="auto">
            <Text fontSize="2xl" mb={4} fontWeight="bold" textAlign="center">
                User Management
            </Text>

            <Box overflowX="auto">
                <Table variant="simple" colorScheme="gray">
                    <Thead>
                        <Tr>
                            <Th>Avatar</Th>
                            <Th>Name</Th>
                            <Th>Username</Th>
                            <Th display={{ base: 'none', md: 'table-cell' }}>Email</Th>
                            <Th display={{ base: 'none', md: 'table-cell' }}>Provider</Th>
                            <Th>Status</Th>
                            <Th display={{ base: 'none', md: 'table-cell' }}>Created</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {listUser.map((user) => (
                            <Tr key={user._id} cursor={'pointer'} onClick={() => handleViewUser(user)} _hover={{ bg: bgColor }}>
                                <Td>
                                    <Avatar size="sm" name={user.name} src={user.profilePic} />
                                </Td>
                                <Td>{user.name}</Td>
                                <Td>{user.username}</Td>
                                <Td display={{ base: 'none', md: 'table-cell' }}>{user.email}</Td>
                                <Td display={{ base: 'none', md: 'table-cell' }}>
                                    <Flex align="center" gap={2} justify="center">
                                        {user.googleId && <FaGoogle />}
                                        {user.facebookId && <FaFacebook />}
                                        {!user.googleId && !user.facebookId && <FaUser />}
                                    </Flex>
                                </Td>
                                <Td>
                                    {user.isVerified ? (
                                        <Badge colorScheme="green">Verified</Badge>
                                    ) : (
                                        <Badge colorScheme="red">Not Verified</Badge>
                                    )}
                                </Td>
                                <Td display={{ base: 'none', md: 'table-cell' }}>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </Td>
                                <Td>
                                    <Flex gap={2}>
                                        <IconButton
                                            size="sm"
                                            icon={user.isBlocked ? <LockIcon /> : <UnlockIcon />}
                                            colorScheme={user.isFrozen ? 'green' : 'red'}
                                            onClick={(e) => { e.stopPropagation(); handleBlockUser(user._id) }}
                                            aria-label="toggle-freeze"
                                        />
                                    </Flex>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>

            <Flex mt={4} justify="space-between" wrap="wrap">
                <Button onClick={() => setPage((p) => Math.max(1, p - 1))} isDisabled={page === 1}>
                    Previous
                </Button>
                <Text mt={{ base: 2, md: 0 }}>
                    Page {page} of {totalPages}
                </Text>
                <Button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    isDisabled={page === totalPages}
                >
                    Next
                </Button>
            </Flex>

            <UserDetailModal isOpen={isOpen} onClose={onClose} user={selectedUser} />
        </Box>
    );
};

export default AdminUserManagement;
