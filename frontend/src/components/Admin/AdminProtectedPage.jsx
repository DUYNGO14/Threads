import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import userAtom from "@atoms/userAtom";
import { useAuthService } from "@services/AuthService";
import { Spinner, Center, Text } from "@chakra-ui/react";

const AdminProtectedPage = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const user = useRecoilValue(userAtom);
    const { initAuth } = useAuthService();
    useEffect(() => {
        const checkAuth = async () => {
            await initAuth(); // Kiểm tra và refresh token nếu cần
            setLoading(false);
        };
        checkAuth();
    }, [initAuth]);

    if (loading) {
        return (
            <Center minH="100vh" flexDir="column">
                <Spinner size="xl" />
                <Text mt={2}>Loading...</Text>
            </Center>
        );
    }

    if (!user) {
        return <Navigate to="/auth" />;
    }

    if (user.role !== "admin") {
        return <Navigate to="/forbidden" />;
    }

    // ✅ Đúng quyền, cho render nội dung
    return <>{children}</>;
};

export default AdminProtectedPage;
