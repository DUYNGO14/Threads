import { useState, useMemo } from "react";
import { Flex, Text, useColorModeValue } from "@chakra-ui/react";
import PropTypes from "prop-types";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";

export default function Tabs({ tabs, onTabChange, initialTab = tabs[0].value, requireAuth = false }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const activeBorderColor = useColorModeValue("black", "white");
    const inactiveBorderColor = useColorModeValue("gray.300", "gray.600");
    const activeTextColor = useColorModeValue("black", "white");
    const inactiveTextColor = useColorModeValue("gray.500", "gray.400");
    const currentUser = useRecoilValue(userAtom);
    const showToast = useShowToast();
    const bgColor = useColorModeValue("gray.100", "#101010");

    // Tối ưu: Dùng useMemo để tránh tính toán lại không cần thiết
    const styles = useMemo(() => ({
        activeBorderColor,
        inactiveBorderColor,
        activeTextColor,
        inactiveTextColor,
    }), [activeBorderColor, inactiveBorderColor, activeTextColor, inactiveTextColor]);

    const handleTabClick = (tabValue) => {
        if (requireAuth) {
            const tab = tabs.find(t => t.value === tabValue);
            if (tab && tab.requireAuth && !currentUser) {
                showToast("Warning", "Please login to access this tab", "warning");
                return;
            }
        }

        // Cuộn lên trên khi click vào tab hiện tại
        if (tabValue === activeTab) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }

        if (tabValue !== activeTab) {
            setActiveTab(tabValue);
            onTabChange(tabValue);
        }
    }

    return (
        <Flex
            w="full"
            mb={4}
            position="sticky"
            top={0}
            zIndex={10}
            bg={bgColor}
            py={2}
            backdropFilter="blur(10px)"
            _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bg: bgColor,
                opacity: 0.8,
                zIndex: -1,
            }}
        >
            {tabs.map((tab) => (
                <Flex
                    key={tab.value}
                    flex={1}
                    borderBottom={`2px solid ${activeTab === tab.value ? styles.activeBorderColor : styles.inactiveBorderColor}`}
                    justifyContent="center"
                    pb={3}
                    cursor="pointer"
                    onClick={() => handleTabClick(tab.value)}
                >
                    <Text fontWeight="bold" color={activeTab === tab.value ? styles.activeTextColor : styles.inactiveTextColor}>
                        {tab.label}
                    </Text>
                </Flex>
            ))}
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