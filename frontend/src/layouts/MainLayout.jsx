import { Box, Button, Grid, GridItem, Icon, Text, useColorMode } from "@chakra-ui/react";
import BaseLayout from "./BaseLayout";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { FaThreads } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const MainLayout = ({ children }) => {
    const { colorMode } = useColorMode();
    const borderColor = colorMode === "dark" ? "whiteAlpha.100" : "gray.200";
    const currentUser = useRecoilValue(userAtom);
    const navigate = useNavigate();
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
                    h="100%" // Đảm bảo phần này có chiều cao đầy đủ
                    borderLeft="1px"
                    borderColor={borderColor}
                    pl={4}
                >
                    {!currentUser && (
                        <Box
                            pt="100px"
                            bg={colorMode === "dark" ? "linear-gradient(180deg, #101010, #2a2a2a)" : "linear-gradient(180deg, #f5f5f5, #e0e0e0)"}
                            borderRadius="xl"
                            textAlign="center"
                            boxShadow="md"
                            p={6}
                        >
                            <Text fontSize="2xl" fontWeight="bold" mb={4} color={colorMode === "dark" ? "white" : "gray.800"}>
                                Log in or sign up to Threads
                            </Text>
                            <Text fontSize="lg" color={colorMode === "dark" ? "gray.400" : "gray.600"} mb={6}>
                                See what people are talking about and join the conversation.
                            </Text>
                            <Button
                                leftIcon={<Icon as={FaThreads} />}
                                bg={colorMode === "dark" ? "whiteAlpha.200" : "blue.100"}
                                border={"1px"}
                                borderColor={colorMode === "dark" ? "whiteAlpha.300" : "gray.300"}
                                _hover={{ bg: colorMode === "dark" ? "whiteAlpha.300" : "blue.200" }}
                                size="lg"
                                w="full"
                                fontWeight="bold"
                                color={colorMode === "dark" ? "white" : "gray.800"}
                                colorScheme="blue"
                                borderRadius="xl"
                                mb={4}
                                onClick={() => navigate("/auth")}
                            >
                                Log in now
                            </Button>
                            <Text fontSize="sm" color={colorMode === "dark" ? "gray.500" : "gray.700"} mt={2}>
                                Log in with username or email
                            </Text>
                        </Box>
                    )}
                </GridItem>

            </Grid>
        </BaseLayout>
    );
};

export default MainLayout;
