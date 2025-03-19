import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Heading, Text } from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";

const OAuthFailure = () => {
    const navigate = useNavigate();
    const showToast = useShowToast();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const error = searchParams.get("error");
        if (error) {
            console.log("OAuth Error:", error); // ✅ Kiểm tra error trên console
            showToast("Error", decodeURIComponent(error), "error");
        }

        // setTimeout(() => {
        //     navigate("/auth"); // ✅ Chuyển hướng về login sau 3s
        // }, 2000);
    }, [searchParams, navigate, showToast]);

    return (
        <Box textAlign="center" mt="50px">
            <Heading color="red.500">⚠ Đăng nhập thất bại</Heading>
            <Text fontSize="lg">{searchParams.get("error") ? decodeURIComponent(searchParams.get("error")) : "Vui lòng thử lại."}</Text>
            <Button onClick={() => navigate("/auth")}>Quay lại</Button>
        </Box>
    );
};

export default OAuthFailure;
