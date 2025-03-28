import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    plugins: [react()],
    server: {
      port: isProduction ? 5000 : 3000,
      // Get rid of the CORS error
      proxy: {
        "/api": {
          target: isProduction
            ? "https://threads-0m08.onrender.com"
            : "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
