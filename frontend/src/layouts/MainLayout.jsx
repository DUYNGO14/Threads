import { Grid, GridItem, useColorMode } from "@chakra-ui/react";
import BaseLayout from "./BaseLayout";

const MainLayout = ({ children }) => {
    const { colorMode } = useColorMode();
    const borderColor = colorMode === "dark" ? "whiteAlpha.100" : "gray.200";

    return (
        <BaseLayout>
            <Grid
                templateColumns={{
                    base: "1fr",
                    xl: "320px minmax(auto, 800px) 320px",
                }}
                gap={{ base: 2, md: 4 }}
                maxW="1440px"
                mx="auto"
                transition="all 0.3s ease"
            >
                {/* Left Sidebar */}
                <GridItem
                    display={{ base: "none", xl: "block" }}
                    position="sticky"
                    top={0}
                    h="100%"
                    overflowY="auto"
                    borderRight="1px"
                    borderColor={borderColor}
                    pr={4}
                />
                {/* Main Content */}
                <GridItem
                    maxW={{ base: "750px", xl: "960px" }} // Tăng từ 850px → 960px
                    w="full"
                    mx="auto"
                    pb={{ base: "80px", lg: 4 }}
                >
                    {children}
                </GridItem>
                {/* Right Sidebar */}
                <GridItem
                    display={{ base: "none", xl: "block" }}
                    position="sticky"
                    top="20px"
                    h="100%"
                    borderLeft="1px"
                    borderColor={borderColor}
                    pl={4}
                />
            </Grid>
        </BaseLayout>
    );
};

export default MainLayout;
