import { Box, useColorMode } from "@chakra-ui/react";
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
                {children}
            </Box>
        </BaseLayout>
    );
};

export default ChatLayout; 