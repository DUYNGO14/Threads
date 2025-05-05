import { Box } from "@chakra-ui/react";
import { Bar } from "react-chartjs-2";

export default function BarChartCard({ title, chartData, chartOptions, children }) {
    return (
        <Box p={4} shadow="md" borderWidth="1px" borderRadius="md" bg="gray.50" _dark={{ bg: "gray.800" }} height="480px">
            {children}
            <Box height="400px">
                <Bar options={chartOptions(title)} data={chartData} />
            </Box>
        </Box>

    );
}
