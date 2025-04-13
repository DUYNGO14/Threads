import { createContext, useContext, useEffect, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import io from "socket.io-client";
import userAtom from "../atoms/userAtom";
import { unreadConversationsCountAtom, conversationsAtom } from "../atoms/messagesAtom";
import PropTypes from "prop-types";

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const user = useRecoilValue(userAtom);
  const setUnreadCount = useSetRecoilState(unreadConversationsCountAtom);
  const setConversations = useSetRecoilState(conversationsAtom);

  const BACKEND_URL = import.meta.env.PROD
    ? "https://threads-0m08.onrender.com"
    : "http://localhost:5000";

  // ✅ Fetch conversations ở đây khi user đăng nhập
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/messages/conversations");
        const data = await res.json();
        if (!data.error) {
          setConversations(data);

          // Cập nhật unreadCount ngay lần đầu
          const unreadCount = data.filter((conv) => conv.unreadCount > 0).length;
          setUnreadCount(unreadCount);
        }
      } catch (err) {
        console.error("Error loading conversations:", err.message);
      }
    };

    if (user?._id) {
      fetchConversations();
    }
  }, [user?._id, setConversations, setUnreadCount]);

  useEffect(() => {
    if (!user?._id) return;

    const socket = io(BACKEND_URL, {
      query: { userId: user._id },
      transports: ["websocket", "polling"],
    });

    setSocket(socket);

    socket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    // ✅ Lắng nghe cập nhật tin nhắn chưa đọc
    socket.on("updateUnreadCounts", (unreadMap) => {
      const count = Object.values(unreadMap).filter((c) => c > 0).length;
      setUnreadCount(count);

      setConversations((prev) =>
        prev.map((c) => {
          const newUnread = unreadMap[c._id] || 0;
          if (c.unreadCount !== newUnread) {
            return { ...c, unreadCount: newUnread }; // chỉ clone nếu khác
          }
          return c;
        })
      );
    });

    return () => {
      socket.disconnect();
      socket.off("getOnlineUsers");
      socket.off("updateUnreadCounts");
      setSocket(null);
    };
  }, [user?._id, setUnreadCount, setConversations, BACKEND_URL]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

SocketContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
