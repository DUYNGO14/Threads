import { useEffect } from "react";

const useOffline = () => {
  useEffect(() => {
    const handleOffline = () => {
      console.warn("Bạn đang ngoại tuyến");
      window.location.replace("/offline.html");
    };

    const handleOnline = () => {
      console.log("Kết nối mạng đã phục hồi!");
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    // Kiểm tra ngay khi mount
    if (!navigator.onLine) {
      handleOffline();
    }
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);
};

export default useOffline;
