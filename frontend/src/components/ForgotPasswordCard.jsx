import { useState } from "react";
import {
    Box, Button, FormControl, FormLabel, Input, Stack, Text, useColorModeValue
} from "@chakra-ui/react";
import { useSetRecoilState } from "recoil";
import authScreenAtom from "../atoms/authAtom";
import useShowToast from "../hooks/useShowToast";

const ForgotPasswordCard = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const setAuthScreen = useSetRecoilState(authScreenAtom);
    const showToast = useShowToast();

    const handleSendEmail = async () => {
        if (!email) {
            return showToast("Error", "Please enter your email", "error");
        }

        try {
            setIsLoading(true);
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);
            showToast("Success", "Password reset link sent to your email!", "success");
        } catch (error) {
            showToast("Error", error.message || "Something went wrong", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box maxW="400px" mx="auto" mt={10} p={6} rounded="lg" bg={useColorModeValue('white', 'gray.dark')} boxShadow="lg">
            <Stack spacing={4}>
                <Text fontSize="lg" fontWeight="bold">Forgot Password</Text>
                <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </FormControl>
                <Button bg={useColorModeValue("gray.600", "gray.700")}
                    color={'white'}
                    _hover={{ bg: useColorModeValue("gray.700", "gray.800") }} isLoading={isLoading} onClick={handleSendEmail}>
                    Send OTP
                </Button>
                <Text color="blue.500" cursor="pointer" textAlign="center" onClick={() => setAuthScreen("login")}>
                    Back to Login
                </Text>
            </Stack>
        </Box>
    );
};

export default ForgotPasswordCard;
