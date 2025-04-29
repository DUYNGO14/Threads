// src/components/ProtectedPage.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";  // Chứa thông tin người dùng
import { useAuthService } from "../services/AuthService"; // Service kiểm tra và refresh token nếu cần

const ProtectedPage = ({ children }) => {
    const [loading, setLoading] = useState(true);  // Để track trạng thái loading khi kiểm tra token
    const user = useRecoilValue(userAtom);  // Kiểm tra nếu user đã đăng nhập
    const { initAuth } = useAuthService();  // Dùng service kiểm tra token và refresh nếu cần

    useEffect(() => {
        const checkAuth = async () => {
            await initAuth(); // Kiểm tra token và refresh nếu cần
            setLoading(false);  // Đã kiểm tra xong, có thể render trang
        };
        checkAuth();
    }, [initAuth]);

    // Nếu đang kiểm tra trạng thái login thì render loading
    if (loading) {
        return <div>Loading...</div>;
    }

    // Nếu không có user, redirect về trang login
    if (!user) {
        return <Navigate to="/auth" />;
    }

    return <>{children}</>;  // Nếu có user, render trang yêu cầu
};

export default ProtectedPage;
