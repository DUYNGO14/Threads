import { Box, Text, Flex, useColorMode } from "@chakra-ui/react";
import BaseLayout from "./BaseLayout";
import { Outlet } from "react-router-dom";

const ChatLayout = () => {
    const { colorMode } = useColorMode();

    return (
        <BaseLayout>
            <Box w="full" minH="100vh" bg={colorMode === "dark" ? "black" : "white"}>

                <Box p={4}>
                    <Outlet />
                </Box>
            </Box>
        </BaseLayout>
    );
};

export default ChatLayout;