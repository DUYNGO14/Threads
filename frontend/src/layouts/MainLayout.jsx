import { Grid, GridItem, useColorMode } from "@chakra-ui/react";
import BaseLayout from "./BaseLayout";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";

const MainLayout = ({ children }) => {
    const { colorMode } = useColorMode();

    return (
        <BaseLayout>
            <Grid
                templateColumns={{
                    base: "1fr",
                    xl: "320px minmax(auto, 800px) 320px"
                }}
                gap={{ base: 2, md: 4 }}
                maxW="1440px"
                mx="auto"
                transition="all 0.3s ease"
            >
                <GridItem
                    display={{ base: "none", xl: "block" }}
                    position="sticky"
                    top={0}
                    height="100%"
                    overflowY="auto"
                    transition="all 0.3s ease"
                    borderRight="1px"
                    borderColor={colorMode === "dark" ? "whiteAlpha.100" : "gray.200"}
                    pr={4}
                >
                    {/* <LeftSidebar /> */}
                </GridItem>

                <GridItem
                    colSpan={{ base: 1, xl: 1 }}
                    maxW={{ base: "750px", xl: "850px" }}
                    mx="auto"
                    w="full"
                    pb={{ base: "80px", lg: 4 }}
                    transition="all 0.3s ease"
                >

                    {children}
                </GridItem>

                <GridItem
                    display={{ base: "none", xl: "block" }}
                    position="sticky"
                    top="20px"
                    height="100%"
                    transition="all 0.3s ease"
                    borderLeft="1px"
                    borderColor={colorMode === "dark" ? "whiteAlpha.100" : "gray.200"}
                    pl={4}
                >
                </GridItem>
            </Grid>
        </BaseLayout>
    );
};

export default MainLayout; 