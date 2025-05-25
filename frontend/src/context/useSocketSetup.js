import { useEffect } from "react";
import io from "socket.io-client";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  unreadConversationsCountAtom,
  conversationsAtom,
} from "../atoms/messagesAtom";
import { countOnlineAtom } from "../atoms/onlineAtom";
import {
  unreadNotificationCountAtom,
  notificationAtom,
} from "../atoms/notificationAtom";
import { useNavigate } from "react-router-dom";
import useShowToast from "@hooks/useShowToast";
import userAtom from "../atoms/userAtom";
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
  const setCountOnline = useSetRecoilState(countOnlineAtom);
  const currentUser = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(BACKEND_URL, {
      query: { userId: user._id },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("getOnlineUsers", (onlineUsers) => {
      setOnlineUsers(onlineUsers);
      setCountOnline(onlineUsers.length);
    });

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
      console.log("New notification:", notification);
      if (Notification.permission === "granted") {
        const browserNotification = new Notification(
          notification.sender.username || "New notification",
          {
            body: notification.content,
            icon: notification.sender.profilePic || "/default-avatar.png",
          }
        );

        browserNotification.onclick = () => {
          window.focus();
          if (notification.type === "follow" && notification.sender) {
            navigate(`/${notification.sender.username}`); // ✅ dùng navigate mượt hơn
          } else if (notification.post) {
            navigate(
              `/${currentUser.username}/post/${
                notification.post?._id || notification.post
              }`
            ); // ✅ dùng navigate mượt hơn
          }
        };
      }

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
