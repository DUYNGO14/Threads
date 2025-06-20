import { Box, Container, useColorMode } from "@chakra-ui/react";
import BaseLayout from "./BaseLayout";
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
    const { colorMode } = useColorMode();

    return (
        <BaseLayout showHeader={false}>
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                minH="100vh"
                py={8}
            >
                <Container
                    maxW="400px"
                    bg={colorMode === "dark" ? "black" : "white"}
                    borderRadius="xl"
                    p={8}
                    boxShadow="lg"
                >
                    <Outlet />
                </Container>
            </Box>
        </BaseLayout>
    );
};

export default AuthLayout;