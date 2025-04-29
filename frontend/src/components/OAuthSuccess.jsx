import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { Spinner, Text, VStack, Box, useColorModeValue } from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import api from "../services/api.js";
const OAuthSuccess = () => {
    const navigate = useNavigate();
    const setUser = useSetRecoilState(userAtom);
    const showToast = useShowToast();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // 1. Lấy accessToken từ URL
                const params = new URLSearchParams(window.location.search);
                const accessToken = params.get("accessToken");

                if (accessToken) {
                    localStorage.setItem("access-token", accessToken);
                }

                // 2. Gọi API lấy user
                const res = await api.get("/api/auth/me", { credentials: "include" });
                const data = res.data;

                if (data._id) {
                    setUser(data);
                    navigate("/");
                } else {
                    showToast("Error", "Không thể lấy thông tin người dùng", "error");
                    navigate("/auth");
                }
            } catch (error) {
                showToast("Error", "Đăng nhập thất bại", "error");
                navigate("/auth");
            }
        };

        fetchUser();
    }, [navigate, setUser, showToast]);

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minH="100vh"
            bg={useColorModeValue("white", "gray.dark")}
        >
            <VStack spacing={4}>
                <Spinner size="xl" color="teal.500" />
                <Text fontSize="lg" color="gray.500">Đang đăng nhập...</Text>
            </VStack>
        </Box>
    );
};

export default OAuthSuccess;
