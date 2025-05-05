import { Box, Button, Heading, Text, VStack, Icon } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { MdBlock } from "react-icons/md";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const ForbiddenPage = () => {
    const navigate = useNavigate();
    return (
        <Box
            minH="100vh"
            display="flex"
            justifyContent="center"
            alignItems="center"
            bg="gray.50"
            _dark={{ bg: "gray.900" }}
            px={4}
        >
            <VStack spacing={6} textAlign="center">
                {/* Biểu tượng động */}
                <MotionBox
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <Icon as={MdBlock} boxSize={16} color="red.500" />
                </MotionBox>

                {/* Tiêu đề */}
                <Heading fontSize="4xl">403 - Forbidden</Heading>

                {/* Mô tả */}
                <Text fontSize="lg" color="gray.600" _dark={{ color: "gray.300" }}>
                    You do not have permission to access this page. Please log in with the correct account or return to the homepage.
                </Text>

                {/* Nút quay lại */}
                <Button
                    colorScheme="blue"
                    onClick={() => navigate("/")}
                    size="lg"
                    borderRadius="xl"
                >
                    Go to Homepage
                </Button>
            </VStack>
        </Box>
    );
};

export default ForbiddenPage;