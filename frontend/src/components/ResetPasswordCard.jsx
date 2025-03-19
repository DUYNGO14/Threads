import { useState } from "react";
import {
    Box, Button, FormControl, FormLabel, Input, InputGroup, InputRightElement, Stack, Text, useColorModeValue
} from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useParams, useNavigate } from "react-router-dom";
const ResetPasswordCard = () => {
    const [state, setState] = useState({
        showPassword: false,
        password: "",
        confirmPassword: "",
        isLoading: false,
    });
    const showToast = useShowToast();
    const { token } = useParams();
    const navigate = useNavigate();
    // Kiểm tra độ mạnh của mật khẩu
    const isPasswordStrong = (password) => {
        return password.length >= 5 && /\d/.test(password) && /[A-Z]/.test(password) && /[!@#$%^&*]/.test(password);
    };

    const handleResetPassword = async () => {
        if (!state.password || !state.confirmPassword) {
            return showToast("Error", "Please enter a new password", "error");
        }

        if (state.password !== state.confirmPassword) {
            return showToast("Error", "Passwords do not match", "error");
        }

        if (!isPasswordStrong(state.password)) {
            return showToast("Error", "Password must be at least 5 characters long.", "error");
        }

        try {
            setState((prev) => ({ ...prev, isLoading: true }));

            const res = await fetch(`/api/auth/reset-password/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword: state.password.trim() }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to reset password");

            showToast("Success", "Password reset successful! Please login.", "success");
            navigate("/auth");
        } catch (error) {
            showToast("Error", error.message, "error");
        } finally {
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    };

    const toggleShowPassword = () => {
        setState((prev) => ({ ...prev, showPassword: !prev.showPassword }));
    };

    return (
        <Box maxW="400px" mx="auto" mt={10} p={6} rounded="lg" bg={useColorModeValue("white", "gray.700")} boxShadow="lg">
            <Stack spacing={4}>
                <Text fontSize="lg" fontWeight="bold">Set New Password</Text>

                <FormControl isRequired>
                    <FormLabel>New Password</FormLabel>
                    <InputGroup>
                        <Input
                            type={state.showPassword ? "text" : "password"}
                            value={state.password}
                            onChange={(e) => setState({ ...state, password: e.target.value })}
                        />
                        <InputRightElement h={'full'}>
                            <Button variant={'ghost'} onClick={toggleShowPassword}>
                                {state.showPassword ? <ViewIcon /> : <ViewOffIcon />}
                            </Button>
                        </InputRightElement>
                    </InputGroup>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Confirm Password</FormLabel>
                    <InputGroup>
                        <Input
                            type={state.showPassword ? "text" : "password"}
                            value={state.confirmPassword}
                            onChange={(e) => setState({ ...state, confirmPassword: e.target.value })}
                        />
                    </InputGroup>
                </FormControl>

                <Button colorScheme="blue" isLoading={state.isLoading} onClick={handleResetPassword}>
                    Reset Password
                </Button>
            </Stack>
        </Box>
    );
};

export default ResetPasswordCard;
