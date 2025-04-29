// src/utils/api.js
import axios from "axios";

const api = axios.create({ withCredentials: true });

export const setupInterceptors = (navigate) => {
  api.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem("access-token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response) {
        const { status } = error.response;

        if (status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const res = await axios.get("/api/auth/refresh-token", {
              withCredentials: true,
            });

            const { accessToken } = res.data;
            localStorage.setItem("access-token", accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            console.error("Cannot refresh token", refreshError);
            navigate("/auth"); // Redirect đến trang login nếu hết hạn luôn cả refresh token
          }
        }

        if (status === 500) {
          navigate("/server-error");
        }
      }

      return Promise.reject(error);
    }
  );
};

export default api;
