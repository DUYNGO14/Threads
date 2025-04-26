import { useEffect } from "react";
import io from "socket.io-client";
import { useSetRecoilState } from "recoil";
import {
  unreadConversationsCountAtom,
  conversationsAtom,
} from "../atoms/messagesAtom";
import {
  unreadNotificationCountAtom,
  notificationAtom,
} from "../atoms/notificationAtom";
import useShowToast from "../hooks/useShowToast";
import messageSound from "../assets/sounds/message.mp3";
const BACKEND_URL = import.meta.env.PROD
  ? "https://threads-0m08.onrender.com"
  : "http://localhost:5000";

const useSocketSetup = (user, socketRef, setOnlineUsers) => {
  const setUnreadCount = useSetRecoilState(unreadConversationsCountAtom);
  const setConversations = useSetRecoilState(conversationsAtom);
  const setNotification = useSetRecoilState(notificationAtom);
  const setUnreadNotificationCount = useSetRecoilState(
    unreadNotificationCountAtom
  );
  const showToast = useShowToast();

  useEffect(() => {
    if (!user?._id) return;

    const socket = io(BACKEND_URL, {
      query: { userId: user._id },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("getOnlineUsers", setOnlineUsers);

    socket.on("updateUnreadCounts", (unreadMap) => {
      const count = Object.values(unreadMap).filter((c) => c > 0).length;
      setUnreadCount(count);

      setConversations((prev) =>
        prev.map((c) => {
          const newUnread = unreadMap[c._id] || 0;
          return c.unreadCount !== newUnread
            ? { ...c, unreadCount: newUnread }
            : c;
        })
      );
    });

    socket.on("notification:new", (notification) => {
      setNotification((prev) => [notification, ...prev]);
      setUnreadNotificationCount((prev) => prev + 1);
      showToast("🔔 Bạn có thông báo mới!");
    });

    socket.on("markNotificationsAsSeen", (updatedNotification) => {
      setNotification((prev) =>
        prev.map((n) =>
          n._id === updatedNotification._id ? updatedNotification : n
        )
      );
      setUnreadNotificationCount((prev) => Math.max(prev - 1, 0));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id]);
};

export default useSocketSetup;
