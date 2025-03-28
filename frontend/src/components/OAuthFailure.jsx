import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Heading, Text } from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";

const OAuthFailure = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const showToast = useShowToast();

    useEffect(() => {
        const error = searchParams.get("error");
        if (error) {
            showToast("Error", decodeURIComponent(error), "error");
        } else {
            showToast("Error", "Authentication failed", "error");
        }
        navigate("/auth");
    }, [navigate, searchParams, showToast]);

    return (
        <Box textAlign="center" mt="50px">
            <Heading color="red.500">⚠ Đăng nhập thất bại</Heading>
            <Text fontSize="lg">{searchParams.get("error") ? decodeURIComponent(searchParams.get("error")) : "Vui lòng thử lại."}</Text>
            <Button onClick={() => navigate("/auth")}>Quay lại</Button>
        </Box>
    );
};

export default OAuthFailure;
