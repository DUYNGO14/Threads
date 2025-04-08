import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
        "/socket.io": {
          target: "http://localhost:5000",
          ws: true, // ⚠ Quan trọng để WebSocket hoạt động
        },
      },
    },
  };
});
