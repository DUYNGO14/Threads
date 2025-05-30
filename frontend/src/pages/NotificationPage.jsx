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
    Skeleton,
    SkeletonCircle,
} from "@chakra-ui/react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { notificationAtom, unreadNotificationCountAtom } from "../atoms/notificationAtom";
import { useSocket } from "@context/SocketContext";
import useShowToast from "@hooks/useShowToast";
import { useNavigate } from "react-router-dom";
import { FiMoreVertical } from "react-icons/fi";
import userAtom from "../atoms/userAtom";
import api from "../services/api.js";

const NotificationSkeleton = () => (
    <Box p={4} borderBottom="1px solid" borderColor="gray.500" mb={4}>
        <HStack spacing={4}>
            <SkeletonCircle size="12" />
            <Box flex="1">
                <Skeleton height="16px" width="60%" mb={2} />
                <Skeleton height="12px" width="40%" />
            </Box>
            <Skeleton height="12px" width="20px" />
        </HStack>
    </Box>
);

const NotificationPage = () => {
    const [notifications, setNotifications] = useRecoilState(notificationAtom);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();
    const showToast = useShowToast();
    const navigate = useNavigate();
    const currentUser = useRecoilValue(userAtom);
    const setUnreadNotificationCount = useSetRecoilState(unreadNotificationCountAtom);

    const bg = useColorModeValue("gray.50", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const hoverBg = useColorModeValue("gray.100", "gray.600");
    // Tính toán danh sách thông báo chưa đọc
    const unreadNotifications = useMemo(() => notifications.filter((n) => !n.isRead), [notifications]);

    // Fetch notifications từ server khi component mount
    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const res = await api.get("/api/notifications");
                const data = await res.data;
                if (data.error) {
                    showToast("Error", data.error, "error");
                } else if (Array.isArray(data)) {
                    setNotifications(data);
                    setUnreadNotificationCount(data.filter((n) => !n.isRead).length);
                }
            } catch (error) {
                showToast("Error", "Failed to load notifications", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [setNotifications, setUnreadNotificationCount, showToast]);

    // Đánh dấu tất cả đã đọc
    const markAllAsRead = useCallback(async () => {
        try {
            const res = await api.patch("/api/notifications/mark-all-read");
            const data = await res.data;

            if (data.error) {
                showToast("Error", data.error, "error");
                return;
            }

            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadNotificationCount(0);
        } catch {
            showToast("Error", "Cannot mark all as read", "error");
        }
    }, [setNotifications, setUnreadNotificationCount, showToast]);

    // Xóa thông báo
    const deleteNotification = useCallback(
        async (id) => {
            try {
                const res = await api.delete(`/api/notifications/delete/${id}`);
                const data = await res.data;

                if (data.error) {
                    showToast("Error", "Something went wrong", "error");
                    return;
                }

                setNotifications((prev) => prev.filter((n) => n._id !== id));
            } catch {
                showToast("Error", "Something went wrong", "error");
            }
        },
        [setNotifications, showToast]
    );

    // Định dạng thời gian hiển thị
    const formatTime = useCallback((dateStr) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour12: false,
        }).format(date);
    }, []);

    // Xử lý điều hướng khi click thông báo
    const handleNavigate = useCallback(
        (noti) => {
            if (socket && !noti.isRead && noti._id) {
                socket.emit("notification:seen", { notificationId: noti._id });
            }
            if (["like", "reply", "post"].includes(noti.type)) {
                navigate(`/${currentUser.username}/post/${noti.post?._id || noti.post}`);
            } else if (noti.type === "follow") {
                navigate(`/user/${noti.sender.username}`);
            } else if (["report", "block", "unblock", "system"].includes(noti.type)) {
                // Không làm gì với các loại này
                return;
            } else {
                navigate(`/user/${noti.sender.username}`);
            }
        },
        [socket, navigate, currentUser.username]
    );

    // Render danh sách thông báo hoặc skeleton khi loading
    const renderNotifications = (notis) => {
        if (loading) {
            return (
                <VStack align="stretch" spacing={4} mt={2} maxH={"70vh"} overflowY={"auto"}>
                    {[...Array(5)].map((_, i) => (
                        <NotificationSkeleton key={i} />
                    ))}
                </VStack>
            );
        }

        if (notis.length === 0) {
            return (
                <Text fontStyle="italic" color="gray.500" textAlign="center" mt={4}>
                    No notifications
                </Text>
            );
        }

        return (
            <VStack align="stretch" spacing={4} mt={2} maxH={"70vh"} overflowY={"auto"}>
                {notis.map((noti) => (
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
                            <HStack spacing={3} align="start" cursor="pointer" onClick={() => handleNavigate(noti)}>
                                {noti.sender ? (<Avatar size="md" name={noti.sender?.username} src={noti.sender?.profilePic} />
                                ) : (
                                    <Avatar size="md" name="System" src="/logo-favicon.png" />
                                )}
                                <Box>
                                    <HStack>
                                        <Text fontWeight="semibold">{noti.sender?.username || "System"}</Text>
                                        {!noti.isRead && (
                                            <Badge colorScheme="red" fontSize="0.6em">
                                                New
                                            </Badge>
                                        )}
                                    </HStack>
                                    <Text fontSize="sm" color="gray.500" whiteSpace="pre-wrap" wordBreak="break-word">
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
                ))}
            </VStack>
        );
    };

    return (
        <Flex justify="center" minH="100vh" w="full" p={4}>
            <Box w="full" maxW="2xl" p={6} borderRadius="md" boxShadow="md" >
                <Text fontWeight="bold" fontSize="2xl" textAlign="center" mb={4}>
                    Notifications
                </Text>

                <Tabs variant="enclosed" onChange={(index) => setUnreadOnly(index === 1)}>
                    <TabList>
                        <Tab>All</Tab>
                        <Tab>
                            Unread{" "}
                            <Badge ml={1} colorScheme="red">
                                {unreadNotifications.length}
                            </Badge>
                        </Tab>
                    </TabList>

                    <Box mt={3} textAlign="right">
                        <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={markAllAsRead}
                            isDisabled={unreadNotifications.length === 0 || loading}
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
