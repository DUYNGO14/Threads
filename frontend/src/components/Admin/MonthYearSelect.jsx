import { Grid, Select } from "@chakra-ui/react";

export default function MonthYearSelect({ selectedMonth, selectedYear, onMonthChange, onYearChange }) {
    return (
        <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={4}>
            <Select placeholder="Select Month" value={selectedMonth} onChange={onMonthChange}>
                {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i + 1}>
                        Month {i + 1}
                    </option>
                ))}
            </Select>
            <Select placeholder="Select Year" value={selectedYear} onChange={onYearChange}>
                {["2023", "2024", "2025"].map((year) => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                ))}
            </Select>
        </Grid>
    );
}
