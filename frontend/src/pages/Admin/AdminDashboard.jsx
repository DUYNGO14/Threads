import {
    Box,
    Heading,
    Text,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Icon,
} from "@chakra-ui/react";
import { FaUsers, FaFileAlt, FaExclamationTriangle } from "react-icons/fa";

export default function AdminDashboard() {
    // Dữ liệu mẫu
    const stats = {
        totalUsers: 120,
        totalPosts: 450,
        totalReports: 15,
    };

    return (
        <Box p={6}>
            <Heading mb={4}>Admin Dashboard</Heading>
            <Text mb={6}>Welcome to the Admin Dashboard. Here is an overview of the system:</Text>

            {/* Thống kê tổng quan */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {/* Tổng số người dùng */}
                <Stat
                    p={4}
                    shadow="md"
                    borderWidth="1px"
                    borderRadius="md"
                    bg="gray.50"
                    _dark={{ bg: "gray.800" }}
                >
                    <StatLabel>
                        <Icon as={FaUsers} mr={2} />
                        Total Users
                    </StatLabel>
                    <StatNumber>{stats.totalUsers}</StatNumber>
                    <StatHelpText>
                        <StatArrow type="increase" />
                        5% this month
                    </StatHelpText>
                </Stat>

                {/* Tổng số bài viết */}
                <Stat
                    p={4}
                    shadow="md"
                    borderWidth="1px"
                    borderRadius="md"
                    bg="gray.50"
                    _dark={{ bg: "gray.800" }}
                >
                    <StatLabel>
                        <Icon as={FaFileAlt} mr={2} />
                        Total Posts
                    </StatLabel>
                    <StatNumber>{stats.totalPosts}</StatNumber>
                    <StatHelpText>
                        <StatArrow type="increase" />
                        10% this month
                    </StatHelpText>
                </Stat>

                {/* Tổng số báo cáo */}
                <Stat
                    p={4}
                    shadow="md"
                    borderWidth="1px"
                    borderRadius="md"
                    bg="gray.50"
                    _dark={{ bg: "gray.800" }}
                >
                    <StatLabel>
                        <Icon as={FaExclamationTriangle} mr={2} />
                        Total Reports
                    </StatLabel>
                    <StatNumber>{stats.totalReports}</StatNumber>
                    <StatHelpText>
                        <StatArrow type="decrease" />
                        2% this month
                    </StatHelpText>
                </Stat>
            </SimpleGrid>
        </Box>
    );
}