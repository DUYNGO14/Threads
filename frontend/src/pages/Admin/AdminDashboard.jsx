import React, { useState } from "react";
import {
    Box, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber,
    StatHelpText, StatArrow, Icon, Spinner
} from "@chakra-ui/react";
import { FaUsers, FaFileAlt, FaUserCheck, FaUserTimes } from "react-icons/fa";
import { Bar, Pie } from "react-chartjs-2";
import { useRecoilValue } from "recoil";
import { countOnlineAtom } from "@atoms/onlineAtom";
import useAdminDashboardData from "@hooks/useAdminDashboardData";
import MonthYearSelect from "@components-admin/MonthYearSelect";
import BarChartCard from "@components-admin/BarChartCard";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    LineElement,
    PointElement,
} from "chart.js";
import { statusOrder, statusColors, bgChart, borderColorChart } from "@constants/chartConstant";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement,);

export default function AdminDashboard() {
    const [monthUser, setMonthUser] = useState("");
    const [yearUser, setYearUser] = useState("");
    const [monthPost, setMonthPost] = useState("");
    const [yearPost, setYearPost] = useState("");
    const { registeredData, postsData, postStatusData, growthStats, reportsData, loading } =
        useAdminDashboardData(monthUser, yearUser, monthPost, yearPost);
    const countOnline = useRecoilValue(countOnlineAtom);

    const getStatValue = (id, key) => {
        const item = growthStats.find((stat) => stat._id === id);
        return item ? item[key] : 0;
    };
    const chartOptions = (title) => ({
        responsive: true,
        plugins: {
            legend: { position: "top" },
            title: { display: true, text: title },
        },
        maintainAspectRatio: false,
    });

    const pieChartData = {
        labels: statusOrder,
        datasets: [{
            data: statusOrder.map((status) => {
                const found = postStatusData.find((item) => item._id === status);
                return found ? found.count : 0;
            }),
            backgroundColor: statusColors,
        }],
    };

    const chartDataUser = {
        labels: registeredData.map((item) => `W${item._id.week} - ${item._id.month}/${item._id.year}`),
        datasets: [{
            label: "Registered users by week",
            data: registeredData.map((item) => item.count),
            backgroundColor: bgChart,
            borderColor: borderColorChart,
            borderWidth: 1,
        }],
    };

    const chartDataPost = {
        labels: postsData.map((item) => `W${item._id.week} - ${item._id.month}/${item._id.year}`),
        datasets: [{
            label: "Posts by week",
            data: postsData.map((item) => item.count),
            backgroundColor: bgChart,
            borderColor: borderColorChart,
            borderWidth: 1,
        }],
    };

    const stats = [
        { id: "users", label: "Total Users", icon: FaUsers },
        { id: "posts", label: "Total Posts", icon: FaFileAlt },
        { id: "online", label: "Online Users", icon: FaUserCheck, value: countOnline },
        { id: "offline", label: "Offline Users", icon: FaUserTimes, value: getStatValue("users", "count") - countOnline },
    ];
    const chartDataReport = {
        labels: reportsData.map((item) => `W${item._id.week} - ${item._id.month}/${item._id.year}`),
        datasets: [
            {
                label: "User Reports",
                data: reportsData.map((item) => item.userCount || 0),
                backgroundColor: "rgba(255, 99, 132, 0.6)", // Màu sắc cho cột User
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1,
            },
            {
                label: "Post Reports",
                data: reportsData.map((item) => item.postCount || 0),
                backgroundColor: "rgba(54, 162, 235, 0.6)", // Màu sắc cho cột Post
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
            },
            {
                label: "Comment Reports",
                data: reportsData.map((item) => item.commentCount || 0),
                backgroundColor: "rgba(75, 192, 192, 0.6)", // Màu sắc cho cột Comment
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
            },
        ],
    };
    return (
        <Box p={4} width="100%" mx="auto">
            <Heading mb={4} size="lg" textAlign="center">Admin Dashboard</Heading>
            <Text mb={6} textAlign="center">Welcome to the Admin Dashboard. Here is an overview of the system.</Text>

            {loading && <Box textAlign="center" mb={8}><Spinner size="xl" /></Box>}

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
                {stats.map((item) => (
                    <Stat key={item.id} p={4} shadow="md" borderWidth="1px" borderRadius="md" bg="gray.50" _dark={{ bg: "gray.800" }}>
                        <StatLabel display="flex" alignItems="center">
                            <Icon as={item.icon} mr={2} boxSize={5} />
                            {item.label}
                        </StatLabel>
                        <StatNumber>
                            {item.value !== undefined ? item.value : getStatValue(item.id, "count")}
                        </StatNumber>
                        {["users", "posts"].includes(item.id) && (
                            <StatHelpText>
                                <StatArrow type={getStatValue(item.id, "percentChange") >= 0 ? "increase" : "decrease"} />
                                {Math.abs(getStatValue(item.id, "percentChange")).toFixed(2)}% this month
                            </StatHelpText>
                        )}
                    </Stat>
                ))}
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
                <BarChartCard title="New Registered Users by Week" chartData={chartDataUser} chartOptions={chartOptions}>
                    <MonthYearSelect selectedMonth={monthUser} selectedYear={yearUser}
                        onMonthChange={(e) => setMonthUser(e.target.value)}
                        onYearChange={(e) => setYearUser(e.target.value)} />
                </BarChartCard>
                <BarChartCard title="New Posts by Week" chartData={chartDataPost} chartOptions={chartOptions}>
                    <MonthYearSelect selectedMonth={monthPost} selectedYear={yearPost}
                        onMonthChange={(e) => setMonthPost(e.target.value)}
                        onYearChange={(e) => setYearPost(e.target.value)} />
                </BarChartCard>
            </SimpleGrid>


            {/* <Box mt={8} p={4} shadow="md" borderWidth="1px" borderRadius="md" bg="gray.50" _dark={{ bg: "gray.800" }} maxWidth="600px" mx="auto">
                <Pie data={pieChartData} options={{
                    responsive: true,
                    plugins: { legend: { position: "top" }, title: { display: true, text: "Post Status Distribution" } },
                }} />
            </Box> */}

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
                <Box mt={8} p={4} shadow="md" borderWidth="1px" borderRadius="md" bg="gray.50" _dark={{ bg: "gray.800" }} mx="auto" maxWidth="600px" display="flex" justifyContent="center">
                    <Pie data={pieChartData} options={{
                        responsive: true,
                        plugins: { legend: { position: "top" }, title: { display: true, text: "Post Status Distribution" } },
                    }} />
                </Box>
                <Box mt={8} p={4} shadow="md" borderWidth="1px" borderRadius="md" bg="gray.50" _dark={{ bg: "gray.800" }} mx="auto" maxWidth="600px" display="flex" justifyContent="center">
                    <Bar data={chartDataReport} options={chartOptions("Post and Comment Reports")} />
                </Box>
            </SimpleGrid>
        </Box>
    );
}
