// src/services/AuthService.js
import api from "./api"; // Giả sử bạn đã có axios api setup

export const useAuthService = () => {
  const initAuth = async () => {
    try {
      // Kiểm tra token còn hợp lệ không
      const res = await api.get("/api/auth/check"); // API kiểm tra token
      if (!res.data.success) {
        await refreshAuthToken(); // Nếu token hết hạn, refresh token
      }
    } catch (error) {
      console.error("Error checking token", error);
      // Xử lý khi không thể xác thực token
    }
  };

  const refreshAuthToken = async () => {
    try {
      const res = await api.get("/api/auth/refresh-token");
      if (res.data.accessToken) {
        localStorage.setItem("access-token", res.data.accessToken);
      }
    } catch (error) {
      console.error("Error refreshing token", error);
      // Nếu không thể refresh token, có thể redirect về login
    }
  };

  return { initAuth, refreshAuthToken };
};
