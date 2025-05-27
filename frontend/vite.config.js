import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { generateSW } from "workbox-build";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    plugins: [
      react(),
      {
        name: "vite-plugin-workbox",
        closeBundle: async () => {
          // T o file Service Worker
          generateSW({
            swDest: "dist/service-worker.js",
            globDirectory: "dist",
            globPatterns: [
              "**/*.{html,js,css,png,jpg,svg,ico,webp}",
              "offline.html",
              "offline.svg",
            ],
            navigateFallback: "/offline.html", // 👈 fallback nếu offline
            runtimeCaching: [
              {
                urlPattern: ({ request }) => request.destination === "document",
                handler: "NetworkFirst",
                options: {
                  cacheName: "html-cache",
                },
              },
              {
                urlPattern: ({ request }) =>
                  ["style", "script", "worker"].includes(request.destination),
                handler: "StaleWhileRevalidate",
                options: {
                  cacheName: "asset-cache",
                },
              },
              {
                urlPattern: ({ request }) => request.destination === "image",
                handler: "CacheFirst",
                options: {
                  cacheName: "image-cache",
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                  },
                },
              },
            ],
          });
        },
      },
    ],
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
    build: {
      chunkSizeWarningLimit: 1500, // tăng giới hạn cảnh báo lên 1.5MB
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react")) return "react";
              if (id.includes("firebase")) return "firebase";
              if (id.includes("lodash")) return "lodash";
              if (id.includes("chart.js")) return "chartjs";
              return "vendor";
            }
          },
        },
      },
    },
  };
});
