// src/pages/ServerErrorPage.jsx
import React from 'react';
import { Box, Text, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const ServerErrorPage = () => {
    const navigate = useNavigate();

    const handleBackHome = () => {
        navigate('/');
    };

    return (
        <Box textAlign="center" py={12} px={6}>
            <Text fontSize="4xl" fontWeight="bold" mb={4}>
                Oops! Something went wrong.
            </Text>
            <Text fontSize="lg" mb={6}>
                There was an error on the server. Please try again later.
            </Text>
            <Button colorScheme="blue" onClick={handleBackHome}>
                Go back to Home
            </Button>
        </Box>
    );
};

export default ServerErrorPage;
