import {
    Box,
    Flex,
    Text,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Button,
    VStack,
    HStack,
    Divider,
    Avatar,
    Badge,
    useColorModeValue,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    IconButton,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { notificationAtom, unreadNotificationCountAtom } from "../atoms/notificationAtom";
import { useSocket } from "../context/SocketContext";
import useShowToast from "../hooks/useShowToast";
import { useNavigate } from "react-router-dom";
import { FiMoreVertical } from "react-icons/fi";
import userAtom from "../atoms/userAtom";
import api from "../services/api.js";
const NotificationPage = () => {
    const [notifications, setNotifications] = useRecoilState(notificationAtom);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const { socket } = useSocket();
    const showToast = useShowToast();
    const navigate = useNavigate();
    const currentUser = useRecoilValue(userAtom);
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    const bg = useColorModeValue("gray.50", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const hoverBg = useColorModeValue("gray.100", "gray.600");
    const setUnreadNotificationCount = useSetRecoilState(unreadNotificationCountAtom);
    const markAllAsRead = async () => {
        try {
            const res = await api.patch("/api/notifications/mark-all-read");

            const data = await res.data;

            if (data.error) {
                return showToast("Error", data.error, "error");
            }

            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadNotificationCount(0);
        } catch (err) {
            showToast("Lỗi", "Không thể đánh dấu đã đọc", "error");
        }
    };

    const deleteNotification = async (id) => {
        try {
            const res = await api.delete(`/api/notifications/delete/${id}`);

            const data = await res.data;

            if (data.error) {
                return showToast("Lỗi", data.error, "error");
            }

            setNotifications((prev) => prev.filter((n) => n._id !== id));
            // showToast("Thành công", "Đã xóa thông báo", "success");
        } catch (err) {
            showToast("Lỗi", "Không thể xóa thông báo", "error");
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour12: false,
        }).format(date);
    };
    const handleNavigate = (noti) => {
        if (socket && noti.isRead === false && noti._id) {
            socket.emit("notification:seen", { notificationId: noti._id });
        }
        if (noti.type === "like" || noti.type === "reply" || noti.type === "post") {
            navigate(`/${currentUser.username}/post/${noti.post?._id || noti.post}`);
        } else if (noti.type === "follow") {
            navigate(`/${noti.sender.username}`);
        } else {
            // fallback
            navigate(`/${noti.sender.username}`);
        }
    }
    const renderNotifications = (notis) => (
        <VStack align="stretch" spacing={4} mt={2}>
            {notis.length === 0 ? (
                <Text fontStyle="italic" color="gray.500" textAlign="center">
                    No notifications
                </Text>
            ) : (
                notis.map((noti) => (
                    <Box
                        key={noti._id}
                        p={4}
                        borderRadius="lg"
                        bg={bg}
                        border="1px solid"
                        borderColor={borderColor}
                        _hover={{ bg: hoverBg }}
                        transition="all 0.2s"
                    >
                        <HStack justify="space-between" align="start">
                            <HStack spacing={3} align="start" cursor="pointer" onClick={handleNavigate.bind(null, noti)}>
                                <Avatar
                                    size="md"
                                    name={noti.sender.username}
                                    src={noti.sender.profilePic}
                                />
                                <Box>
                                    <HStack>
                                        <Text fontWeight="semibold">
                                            {noti.sender.username}
                                        </Text>
                                        {!noti.isRead && (
                                            <Badge colorScheme="red" fontSize="0.6em">
                                                New
                                            </Badge>
                                        )}
                                    </HStack>
                                    <Text fontSize="sm" color="gray.500">
                                        {noti.content}
                                    </Text>
                                </Box>
                            </HStack>

                            <VStack align="end" spacing={1}>
                                <Text fontSize="xs" color="gray.400">
                                    {formatTime(noti.createdAt)}
                                </Text>

                                <Menu>
                                    <MenuButton
                                        as={IconButton}
                                        icon={<FiMoreVertical />}
                                        size="xs"
                                        variant="ghost"
                                        aria-label="Options"
                                    />
                                    <MenuList>
                                        <MenuItem color="red.500" onClick={() => deleteNotification(noti._id)}>
                                            Delete notification
                                        </MenuItem>
                                    </MenuList>
                                </Menu>
                            </VStack>
                        </HStack>
                    </Box>
                ))
            )}
        </VStack>
    );

    return (
        <Flex justify="center" minH="100vh" w="full">
            <Box w="full" maxW="2xl" p={6}>
                <Text fontWeight="bold" fontSize="2xl" textAlign="center" mb={4}>
                    Notifications
                </Text>

                <Tabs variant="enclosed" onChange={(i) => setUnreadOnly(i === 1)}>
                    <TabList>
                        <Tab>All</Tab>
                        <Tab>Unread ({unreadNotifications.length})</Tab>
                    </TabList>

                    <Box mt={3} textAlign="right">
                        <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={markAllAsRead}
                            isDisabled={unreadNotifications.length === 0}
                        >
                            Mark all as read
                        </Button>
                    </Box>

                    <Divider my={3} />

                    <TabPanels>
                        <TabPanel>{renderNotifications(notifications)}</TabPanel>
                        <TabPanel>{renderNotifications(unreadNotifications)}</TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </Flex>
    );
};

export default NotificationPage;
