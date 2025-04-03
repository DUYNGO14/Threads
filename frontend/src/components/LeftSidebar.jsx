import { Box, useColorMode } from "@chakra-ui/react";
import Header from "./Header";
const LeftSidebar = () => {
    const { colorMode } = useColorMode();

    return (
        <Box
            display={{ base: "none", lg: "block" }}
            w={{ lg: "320px" }}
            position="fixed"
            left={{ lg: "50%" }}
            ml={{ lg: "-600px" }}
            top={0}
            h="100vh"
            borderRight="1px"
            borderColor={colorMode === "dark" ? "whiteAlpha.100" : "gray.200"}
            pt="70px"
            overflowY="auto"
            css={{
                '&::-webkit-scrollbar': {
                    width: '2px',
                },
                '&::-webkit-scrollbar-track': {
                    width: '2px',
                },
                '&::-webkit-scrollbar-thumb': {
                    background: colorMode === "dark" ? '#ffffff20' : '#00000020',
                    borderRadius: '24px',
                },
            }}
        >
            <Header />
            {/* Left sidebar content will go here */}
        </Box>
    );
};

export default LeftSidebar; 