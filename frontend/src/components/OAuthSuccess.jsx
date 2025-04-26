import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { Spinner, Text, VStack, Box, useColorModeValue } from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import { saveEncryptedData } from "../../utils/encryptedData";

const OAuthSuccess = () => {
    const navigate = useNavigate();
    const setUser = useSetRecoilState(userAtom);
    const showToast = useShowToast();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/auth/me", { credentials: "include" });
                const data = await res.json();

                if (data._id) {
                    saveEncryptedData("user-threads", data);
                    setUser(data);
                    //showToast("Success", "Đăng nhập thành công!", "success");
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
