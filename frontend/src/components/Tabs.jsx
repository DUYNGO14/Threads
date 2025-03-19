import { useState, useCallback } from "react";
import { Flex, Text, useColorModeValue } from "@chakra-ui/react";
import PropTypes from "prop-types";
import { debounce } from "lodash";

export default function Tabs({ onTabChange }) {
    const [activeTab, setActiveTab] = useState("propose");

    // Màu sắc theo chế độ sáng/tối
    const activeBorderColor = useColorModeValue("black", "white");
    const inactiveBorderColor = useColorModeValue("gray.300", "gray.600");
    const activeTextColor = useColorModeValue("black", "white");
    const inactiveTextColor = useColorModeValue("gray.500", "gray.400");

    // 🟢 Hàm debounce để hạn chế spam click
    const debouncedTabChange = useCallback(
        debounce((tab) => onTabChange(tab), 100),
        []
    );
    const handleTabClick = (tab) => {
        if (tab !== activeTab) { // Chỉ xử lý nếu đổi tab
            setActiveTab(tab);
            debouncedTabChange(tab);
        }
    };

    return (
        <Flex w="full" mb={4}>
            {/* Tab Propose */}
            <Flex
                flex={1}
                borderBottom={`2px solid ${activeTab === "propose" ? activeBorderColor : inactiveBorderColor}`}
                justifyContent="center"
                pb={3}
                cursor="pointer"
                onClick={() => handleTabClick("propose")}
            >
                <Text fontWeight="bold" color={activeTab === "propose" ? activeTextColor : inactiveTextColor}>
                    Propose
                </Text>
            </Flex>
            {/* Tab Followed */}
            <Flex
                flex={1}
                borderBottom={`2px solid ${activeTab === "followed" ? activeBorderColor : inactiveBorderColor}`}
                justifyContent="center"
                pb={3}
                cursor="pointer"
                onClick={() => handleTabClick("followed")}
            >
                <Text fontWeight="bold" color={activeTab === "followed" ? activeTextColor : inactiveTextColor}>
                    Followed
                </Text>
            </Flex>


        </Flex>
    );
}

Tabs.propTypes = {
    onTabChange: PropTypes.func.isRequired,
};
