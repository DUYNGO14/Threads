import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import useShowToast from "./useShowToast";
import { useRecoilState } from "recoil";
import { selectedConversationAtom } from "../atoms/messagesAtom";

const useMessageNotifications = () => {
  const { socket } = useSocket();
  const showToast = useShowToast();
  const [unreadConversations, setUnreadConversations] = useState(new Set());
  const [selectedConversation] = useRecoilState(selectedConversationAtom);

  useEffect(() => {
    // Xin quyền thông báo
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      const isFromCurrentChat =
        selectedConversation._id === message.conversationId;

      if (!isFromCurrentChat) {
        showToast(
          "Tin nhắn mới",
          `Tin nhắn từ ${message.senderName || "người lạ"}`,
          "info"
        );

        // Nếu tab không active, dùng Notification API
        if (
          document.visibilityState !== "visible" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification("Tin nhắn mới", {
            body: message.text || "Bạn có tin nhắn mới",
            icon: message.senderAvatar || "/default-icon.png",
          });
        }

        setUnreadConversations((prev) =>
          new Set(prev).add(message.conversationId)
        );
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedConversation, showToast]);

  // Reset tin nhắn chưa đọc khi mở conversation
  useEffect(() => {
    if (selectedConversation._id) {
      setUnreadConversations((prev) => {
        const updated = new Set(prev);
        updated.delete(selectedConversation._id);
        return updated;
      });

      socket.emit("markMessagesAsSeen", {
        conversationId: selectedConversation._id,
      });
    }
  }, [selectedConversation, socket]);

  return { unreadConversations, setUnreadConversations };
};

export default useMessageNotifications;
