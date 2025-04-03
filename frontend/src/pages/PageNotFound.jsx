import { Box, Button, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FaHome } from "react-icons/fa";

const PageNotFound = () => {
    return (
        <Container maxW="container.md" py={20}>
            <VStack spacing={8} textAlign="center">
                <Heading
                    fontSize={{ base: "4xl", md: "6xl" }}
                    color="gray.700"
                    fontWeight="bold"
                >
                    404
                </Heading>
                <Box>
                    <Text fontSize="xl" color="gray.600" mb={2}>
                        Oops! Page Not Found
                    </Text>
                    <Text color="gray.500">
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                    </Text>
                </Box>
                <Button
                    as={RouterLink}
                    to="/"
                    leftIcon={<FaHome />}
                    colorScheme="blue"
                    size="lg"
                >
                    Back to Home
                </Button>
            </VStack>
        </Container>
    );
};

export default PageNotFound; 