import { Grid, GridItem, Box, Button, Icon, Text, useColorMode } from "@chakra-ui/react";
import BaseLayout from "./BaseLayout";
import { useRecoilValue } from "recoil";
import userAtom from "@atoms/userAtom";
import { FaThreads } from "react-icons/fa6";
import { Outlet, useNavigate } from "react-router-dom";
import CreatePost from "../components/CreatePost";

const MainLayout = () => {
    const { colorMode } = useColorMode();
    const borderColor = colorMode === "dark" ? "whiteAlpha.100" : "gray.200";
    const currentUser = useRecoilValue(userAtom);
    const navigate = useNavigate();

    return (
        <BaseLayout>
            <Grid
                templateColumns={{
                    base: "1fr",
                    xl: "320px minmax(0, 800px) 320px",
                }}
                gap={{ base: 2, md: 4 }}
                maxW="100vw"
                overflow="hidden"
                mx="auto"
            >
                {/* Left Sidebar (rỗng hoặc tuỳ bạn thêm) */}
                <GridItem
                    display={{ base: "none", xl: "block" }}
                    borderRight="1px"
                    borderColor={borderColor}
                    pr={4}
                />

                {/* Main Content */}
                <GridItem
                    maxW="960px"
                    w="full"
                    mx="auto"
                    pb={{ base: "80px", lg: 4 }}
                >
                    <Outlet />
                </GridItem>

                {/* Right Sidebar */}
                <GridItem
                    display={{ base: "none", xl: "block" }}
                    borderLeft="1px"
                    borderColor={borderColor}
                    pl={4}
                >
                    {!currentUser && (
                        <Box
                            pt="200px"
                            bg={colorMode === "dark" ? "linear-gradient(180deg, #101010, #2a2a2a)" : "linear-gradient(180deg, #f5f5f5, #e0e0e0)"}
                            borderRadius="xl"
                            textAlign="center"
                            boxShadow="md"
                            p={6}
                            w="full"
                            mx="auto"
                            mb={4}
                        >
                            <Text fontSize="2xl" fontWeight="bold" mb={4}>
                                Log in or sign up to DThreads
                            </Text>
                            <Text fontSize="lg" mb={6}>
                                See what people are talking about and join the conversation.
                            </Text>
                            <Button
                                leftIcon={<Icon as={FaThreads} />}
                                bg={colorMode === "dark" ? "whiteAlpha.200" : "blue.100"}
                                border="1px"
                                borderColor={colorMode === "dark" ? "whiteAlpha.300" : "gray.300"}
                                _hover={{ bg: colorMode === "dark" ? "whiteAlpha.300" : "blue.200" }}
                                size="lg"
                                w="full"
                                fontWeight="bold"
                                borderRadius="xl"
                                mb={4}
                                onClick={() => navigate("/auth")}
                            >
                                Log in now
                            </Button>
                            <Text fontSize="sm">
                                Log in with username or email
                            </Text>
                        </Box>
                    )}
                    {currentUser && <CreatePost />}
                </GridItem>
            </Grid>
        </BaseLayout>
    );
};

export default MainLayout;