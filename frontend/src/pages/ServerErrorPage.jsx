import React from "react";
import { Box, Text, Button, VStack } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const MotionText = motion(Text);

const ServerErrorPage = () => {
    const navigate = useNavigate();

    const handleBackHome = () => {
        navigate("/home");
    };

    return (
        <Box
            minH="100vh"
            display="flex"
            justifyContent="center"
            alignItems="center"
            bg="gray.900"
            color="white"
            textAlign="center"
            px={6}
        >
            <VStack spacing={6}>
                {/* Animation cho chữ "500" */}
                <MotionText
                    fontSize="9xl"
                    fontWeight="bold"
                    color="red.500"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    500
                </MotionText>

                {/* Animation cho chữ "ERROR" */}
                <MotionText
                    fontSize="2xl"
                    fontWeight="bold"
                    color="gray.400"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                >
                    ERROR
                </MotionText>

                {/* Mô tả lỗi */}
                <MotionText
                    fontSize="lg"
                    color="gray.300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                >
                    Uh oh, there seems to be a problem. <br />
                    Let me help you find <Text as="span" color="blue.400" textDecoration="underline">a way out</Text>.
                </MotionText>

                {/* Nút quay lại */}
                <MotionText
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1.5 }}
                >
                    <Button
                        colorScheme="blue"
                        size="lg"
                        onClick={handleBackHome}
                        borderRadius="xl"
                    >
                        Go back to Home
                    </Button>
                </MotionText>
            </VStack>
        </Box>
    );
};

export default ServerErrorPage;