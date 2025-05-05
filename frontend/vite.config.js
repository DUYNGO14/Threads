import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": "/src",
        "@pages": "/src/pages",
        "@layouts": "/src/layouts",
        "@styles": "/src/styles",
        "@theme": "/src/theme",
        "@hooks": "/src/hooks",
        "@store": "/src/store",
        "@routes": "/src/routes",
        "@constants": "/src/constant",
        "@config": "/src/config",
        "@components": "/src/components",
        "@components-admin": "/src/components/Admin",
        "@utils": "/src/utils",
        "@assets": "/src/assets",
        "@context": "/src/context",
        "@services": "/src/services",
        "@atoms": "/src/atoms",
      },
    },
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
          ws: true,
        },
      },
    },
  };
});
