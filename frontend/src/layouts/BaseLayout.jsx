import { Grid, GridItem, useColorMode } from "@chakra-ui/react";
import Header from "@components/Header";

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
                    position="fixed"
                    zIndex={999}
                    w={{ base: "100%", lg: "100px" }}
                    h={{ base: "auto", lg: "100vh" }}
                    bottom={{ base: 0, lg: "unset" }}
                    top={{ lg: 0 }}
                >
                    <Header />
                </GridItem>
            )}

            <GridItem
                colStart={{ base: 1, lg: 2 }}
                w="full"
                maxW={{ base: "100%", lg: "calc(100vw - 100px)" }}
                px={{ base: 2, md: 4 }}
                overflowX="hidden"
            >
                {children}
            </GridItem>
        </Grid>
    );
};

export default BaseLayout;
