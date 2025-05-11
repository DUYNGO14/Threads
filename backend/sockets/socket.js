import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import Notification from "../models/notificationModel.js";
import { getUnreadCountsForUser } from "../utils/getUnreadCounts.js";
import {
  setUserSocket,
  removeUserSocket,
  getOnlineUsers,
} from "../utils/socketUsers.js";

export const socketHandler = (io) => {
  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;

    if (!userId || userId === "undefined") {
      socket.disconnect();
      return;
    }

    console.log(`🔌 User connected: ${userId}`);
    setUserSocket(userId, socket.id);

    // ✅ Join phòng theo userId
    socket.join(userId);

    io.emit("getOnlineUsers", getOnlineUsers());
    try {
      const unreadCounts = await getUnreadCountsForUser(userId);
      socket.emit("updateUnreadCounts", unreadCounts);
    } catch (err) {
      console.error("❌ Lỗi khi lấy số lượng chưa đọc lúc kết nối:", err);
    }
    // 📩 Đánh dấu tin nhắn đã xem
    socket.on("markMessagesAsSeen", async ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;
      try {
        const result = await Message.updateMany(
          { conversationId, seen: false, sender: { $ne: userId } },
          { $set: { seen: true } }
        );
        if (result.modifiedCount > 0) {
          await Conversation.updateOne(
            { _id: conversationId, "lastMessage._id": { $exists: true } },
            { $set: { "lastMessage.seen": true } }
          );

          // ✅ emit theo userId (room), không cần socketId
          io.to(userId).emit("messagesSeen", { conversationId });

          const unreadCountMap = await getUnreadCountsForUser(userId);
          io.to(userId).emit("updateUnreadCounts", unreadCountMap);
        }
      } catch (err) {
        console.error("❌ Lỗi khi đánh dấu đã xem:", err);
      }
    });
    socket.on("notification:seen", async ({ notificationId }) => {
      if (!notificationId) return;

      try {
        const updated = await Notification.findByIdAndUpdate(
          notificationId,
          { $set: { isRead: true } },
          { new: true }
        ).populate("sender", "username profilePic");
        if (updated) {
          // Gửi lại notification đã cập nhật về client để đồng bộ UI
          io.to(socket.id).emit("markNotificationsAsSeen", updated);
        } else {
          console.log("❌ Notification không tồn tại");
        }
      } catch (err) {
        console.error("Error marking notification as seen:", err);
      }
    });
    socket.on("joinRoom", (conversationId) => {
      if (!conversationId) return;

      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined room ${conversationId}`);
    });

    socket.on("leaveRoom", (conversationId) => {
      if (!conversationId) return;

      socket.leave(conversationId);
      console.log(`Socket ${socket.id} left room ${conversationId}`);
    });
    socket.on("disconnect", () => {
      const userId = socket.handshake.query.userId;
      console.log(`🔌 User disconnected: ${userId}`);

      if (userId) {
        removeUserSocket(userId);
        io.emit("getOnlineUsers", getOnlineUsers());
      }
    });
  });
};
