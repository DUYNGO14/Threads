import { Box, useColorMode, Text, Flex } from "@chakra-ui/react";
import BaseLayout from "./BaseLayout";

const ChatLayout = ({ children }) => {
    const { colorMode } = useColorMode();

    return (
        <BaseLayout>
            <Box
                w="full"
                minH="100vh"
                bg={colorMode === "dark" ? "black" : "white"}
            >
                {/* Tiêu đề trang Chat */}
                <Flex
                    px={6}
                    py={4}
                    borderBottom="1px solid"
                    borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
                    justify="center"
                    align="center"
                >
                    <Text fontSize="xl" fontWeight="bold">
                        Chat
                    </Text>
                </Flex>

                {/* Nội dung chính */}
                <Box p={4}>
                    {children}
                </Box>
            </Box>
        </BaseLayout>
    );
};

export default ChatLayout;
