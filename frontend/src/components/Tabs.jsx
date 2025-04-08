import { useState } from "react";
import {
    Flex, Text, Menu, MenuButton, MenuList, MenuItem, IconButton, Icon, useColorModeValue
} from "@chakra-ui/react";
import { ChevronDownIcon, CheckIcon, DeleteIcon } from "@chakra-ui/icons";
import PropTypes from "prop-types";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";

export default function Tabs({ tabs, onTabChange, initialTab = tabs[0].value, requireAuth = false }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const currentUser = useRecoilValue(userAtom);
    const showToast = useShowToast();

    const handleTabClick = (tabValue) => {
        if (requireAuth) {
            const tab = tabs.find(t => t.value === tabValue);
            if (tab && tab.requireAuth && !currentUser) {
                showToast("Warning", "Please login to access this tab", "warning");
                return;
            }
        }

        // 🔹 Luôn gọi `onTabChange`, ngay cả khi người dùng nhấn vào tab hiện tại
        setActiveTab(tabValue);
        onTabChange(tabValue);

        // 🔹 Cuộn lên đầu trang
        window.scrollTo({ top: 0, behavior: "smooth" });
    };



    const activeTabLabel = tabs.find(tab => tab.value === activeTab)?.label || tabs[0].label;

    // Điều chỉnh màu sắc theo chế độ sáng/tối
    const bgColor = useColorModeValue("white", "gray.900");
    const hoverBgColor = useColorModeValue("gray.200", "gray.800");
    const textColor = useColorModeValue("black", "white");
    const borderColor = useColorModeValue("gray.300", "gray.700");

    return (
        <Flex w="full" justify="center" px={2} alignItems="center">
            {/* Hiển thị tab đang chọn */}
            <Text fontWeight="semibold" color={textColor} px={4} py={2} fontSize="md" cursor={"pointer"} onClick={() => handleTabClick(activeTab)}>
                {activeTabLabel}
            </Text>

            {/* Nút mở menu */}
            <Menu placement="bottom">
                <MenuButton
                    as={IconButton}
                    size="sm"
                    icon={<ChevronDownIcon />}
                    aria-label="Open Menu"
                    bg={bgColor}
                    color={textColor}
                    ml={1}
                    borderRadius="full"
                    border="1px solid"
                    borderColor={borderColor}
                    _hover={{ bg: hoverBgColor }}
                    _active={{ bg: hoverBgColor }}
                />
                <MenuList
                    bg={bgColor}
                    borderColor={borderColor}
                    boxShadow="lg"
                    borderRadius="md"
                    minW="250px"
                    maxH="300px"
                    overflowY="auto"
                >
                    {tabs.map((tab) => (
                        <MenuItem
                            key={tab.value}
                            onClick={() => handleTabClick(tab.value)}
                            bg={"transparent"}
                            _hover={{ bg: hoverBgColor }}
                            color={textColor}
                            px={4}
                            py={3}
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                        >
                            <Text fontWeight={activeTab === tab.value ? "bold" : "normal"} >
                                {tab.label}
                            </Text>
                            {activeTab === tab.value && <CheckIcon color="blue.400" />}
                        </MenuItem>
                    ))}
                </MenuList>
            </Menu>

        </Flex>
    );
}

Tabs.propTypes = {
    tabs: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            requireAuth: PropTypes.bool,
        })
    ).isRequired,
    onTabChange: PropTypes.func.isRequired,
    initialTab: PropTypes.string,
    requireAuth: PropTypes.bool,
};
