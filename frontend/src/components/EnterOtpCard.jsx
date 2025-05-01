import { useState } from "react";
import {
    Box, Button, FormControl, FormLabel, Input, Stack, Text, useColorModeValue
} from "@chakra-ui/react";
import { useSetRecoilState } from "recoil";
import { authScreenAtom } from "../atoms/authAtom";
import useShowToast from "../hooks/useShowToast";
import api from "../services/api.js";
const EnterOtpCard = () => {
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const setAuthScreen = useSetRecoilState(authScreenAtom);
    const showToast = useShowToast();

    // Lấy email từ localStorage
    const email = localStorage.getItem("email-for-verification");
    const handleResendOTP = async () => {
        try {

            const res = await api.post("/api/auth/resend-otp", { email });
            console.log(res);
            const data = res.data;
            showToast("Success", "A new OTP has been sent to your email.", "success");
        } catch (error) {
            const errorMessage =
                error.response?.data?.error || // Lấy thông báo từ phản hồi API
                error.message || // Lấy thông báo mặc định từ Axios
                "An unexpected error occurred"; // Thông báo mặc định nếu không có thông tin
            showToast("Error", errorMessage || "Something went wrong", "error");
        }
    };
    const handleVerifyOtp = async () => {
        if (!otp) {
            return showToast("Error", "Please enter the OTP", "error");
        }
        try {
            setIsLoading(true);
            const res = await api.post("/api/auth/verify-account", { email, code: otp }); // ✅ Gửi cả email và OTP
            console.log(res);
            const data = res.data;
            if (data.error) throw new Error(data.error);
            showToast("Success", "Email verified successfully!", "success");
            // Xóa email sau khi xác thực
            localStorage.removeItem("email-for-verification");
            setAuthScreen("login"); // Chuyển về trang đăng nhập
        } catch (error) {
            const errorMessage =
                error.response?.data?.error || // Lấy thông báo từ phản hồi API
                error.message || // Lấy thông báo mặc định từ Axios
                "An unexpected error occurred"; // Thông báo mặc định nếu không có thông tin
            showToast("Error", errorMessage || "Something went wrong", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box maxW="400px" mx="auto" mt={10} p={6} rounded="lg" bg={useColorModeValue("white", "gray.700")} boxShadow="lg">
            <Stack spacing={4}>
                <Text fontSize="lg" fontWeight="bold">Enter OTP</Text>
                <FormControl isRequired>
                    <FormLabel>OTP Code</FormLabel>
                    <Input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                    />
                </FormControl>
                <Button colorScheme="blue" isLoading={isLoading} onClick={handleVerifyOtp}>
                    Verify OTP
                </Button>
                <Button colorScheme="blue" isLoading={isLoading} variant="outline" onClick={handleResendOTP}>
                    Resend OTP
                </Button>
            </Stack>
        </Box>
    );
};

export default EnterOtpCard;
