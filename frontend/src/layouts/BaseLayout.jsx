import { Box, useColorMode, Grid, GridItem } from "@chakra-ui/react";
import Header from "../components/Header";

const BaseLayout = ({ children, showHeader = true }) => {
    const { colorMode } = useColorMode();

    return (
        <Grid
            templateColumns={{ base: "1fr", lg: "100px 1fr" }}
            minH="100vh"
            bg={colorMode === "dark" ? "#101010" : "gray.50"}
            transition="all 0.3s ease"
        >
            {showHeader && (
                <GridItem
                    display={{ base: "none", lg: "block" }}
                    position="fixed"
                    left={0}
                    top={0}
                    bottom={0}
                    w="100px"
                    zIndex={999}
                    transition="all 0.3s ease"
                >
                    <Header />
                </GridItem>
            )}
            <GridItem
                colStart={{ base: 1, lg: 2 }}
                w="full"
                maxW={{ base: "100%", lg: "calc(100vw - 100px)" }}
                position="relative"
                overflowX="hidden"
                transition="all 0.3s ease"
                px={{ base: 2, md: 4 }}
            >
                {children}
            </GridItem>
            {showHeader && (
                <GridItem
                    display={{ base: "block", lg: "none" }}
                    position="fixed"
                    bottom={0}
                    left={0}
                    right={0}
                    zIndex={999}
                    transition="all 0.3s ease"
                >
                    <Header />
                </GridItem>
            )}
        </Grid>
    );
};

export default BaseLayout; 