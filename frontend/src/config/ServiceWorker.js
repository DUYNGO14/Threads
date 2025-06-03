const ServiceWorker = {
  register: () => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js") // ✅ đúng tên file được tạo
          .catch((error) => {
            console.error("Service Worker registration failed:", error);
          });
      });
    }
  },
};

export default ServiceWorker;
