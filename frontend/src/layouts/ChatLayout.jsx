import { Box, Text, Flex, useColorMode } from "@chakra-ui/react";
import BaseLayout from "./BaseLayout";
import { Outlet } from "react-router-dom";

const ChatLayout = () => {
    const { colorMode } = useColorMode();

    return (
        <BaseLayout>
            <Box w="full" minH="100vh" bg={colorMode === "dark" ? "black" : "white"}>
                <Flex
                    px={6}
                    py={4}
                    borderBottom="1px solid"
                    borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
                    justify="center"
                    align="center"
                >
                    <Text fontSize="xl" fontWeight="bold">Chat</Text>
                </Flex>

                <Box p={4}>
                    <Outlet />
                </Box>
            </Box>
        </BaseLayout>
    );
};

export default ChatLayout;