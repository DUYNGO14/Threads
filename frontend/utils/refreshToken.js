// src/utils/refreshToken.js
import axios from "axios";

export async function refreshAccessToken() {
  const res = await axios.get("/api/auth/refresh-token", {
    withCredentials: true,
  });
  return res.data.accessToken;
}
