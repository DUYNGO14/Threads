import { useState, useEffect } from "react";
import {
    Flex, Text, Menu, MenuButton, MenuList, MenuItem, IconButton, useColorModeValue, Box
} from "@chakra-ui/react";
import { ChevronDownIcon, CheckIcon } from "@chakra-ui/icons";
import PropTypes from "prop-types";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "@hooks/useShowToast";

export default function Tabs({
    tabs,
    onTabChange,
    initialTab = tabs[0].value,
    requireAuth = false
}) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const currentUser = useRecoilValue(userAtom);
    const showToast = useShowToast();

    const bgColor = useColorModeValue("white", "gray.900");
    const hoverBgColor = useColorModeValue("gray.200", "gray.800");
    const textColor = useColorModeValue("black", "white");
    const borderColor = useColorModeValue("gray.300", "gray.700");

    const handleTabClick = (tabValue) => {
        const selectedTab = tabs.find(t => t.value === tabValue);
        if (requireAuth && selectedTab?.requireAuth && !currentUser) {
            showToast("Warning", "Please login to access this tab", "warning");
            return;
        }

        if (tabValue !== activeTab) {
            setActiveTab(tabValue);
        }

        // ✅ luôn gọi khi click, kể cả tab đang active
        onTabChange(tabValue);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };


    const activeTabLabel = tabs.find(tab => tab.value === activeTab)?.label || "";

    // Đảm bảo activeTab luôn đúng nếu `initialTab` thay đổi từ bên ngoài
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    return (
        <Flex w="full" justify="center" align="center">
            <Flex
                align="center"
                bg={"transparent"}
                px={4}
                py={2}
                borderRadius="full"
                border="1px solid"
                borderColor={borderColor}
                gap={2}
                maxW="full"
            >
                <Text
                    fontWeight="semibold"
                    fontSize="md"
                    color={textColor}
                    cursor="pointer"
                    onClick={() => handleTabClick(activeTab)}
                >
                    {activeTabLabel}
                </Text>

                <Menu placement="bottom">
                    <MenuButton
                        as={IconButton}
                        size="sm"
                        icon={<ChevronDownIcon />}
                        aria-label="Open Menu"
                        bg={bgColor}
                        color={textColor}
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
                        minW="200px"
                        maxH="300px"
                        overflowY="auto"
                    >
                        {tabs.map(tab => (
                            <MenuItem
                                key={tab.value}
                                onClick={() => handleTabClick(tab.value)}
                                bg="transparent"
                                _hover={{ bg: hoverBgColor }}
                                color={textColor}
                                px={4}
                                py={2}
                                display="flex"
                                justifyContent="space-between"
                            >
                                <Text fontWeight={activeTab === tab.value ? "bold" : "normal"}>
                                    {tab.label}
                                </Text>
                                {activeTab === tab.value && <CheckIcon color="blue.400" />}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>
            </Flex>
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
