import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const accessToken = Cookies.get("accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.get("/api/refresh-token", {
          withCredentials: true,
        });
        const { accessToken } = res.data;

        Cookies.set("accessToken", accessToken, { expires: 0.5 / 24 }); // 30 phút

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Cannot refresh token", refreshError);
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
