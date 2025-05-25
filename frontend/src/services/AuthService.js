import api from "./api";

export const useAuthService = () => {
  const initAuth = async () => {
    try {
      const res = await api.get("/api/auth/check");
      if (!res.data.success) {
        await refreshAuthToken();
      }
    } catch (error) {
      console.error("Error checking auth", error.response.data.error);
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
    }
  };

  return { initAuth, refreshAuthToken };
};
