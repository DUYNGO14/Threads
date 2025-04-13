import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import { getUnreadCountsForUser } from "../utils/getUnreadCounts.js";
import {
  setUserSocket,
  removeUserSocket,
  getRecipientSocketId,
  getOnlineUsers,
} from "../utils/socketUsers.js";

export const socketHandler = (io) => {
  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;

    if (!userId || userId === "undefined") return;

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
      try {
        await Message.updateMany(
          { conversationId, seen: false, sender: { $ne: userId } },
          { $set: { seen: true } }
        );

        await Conversation.updateOne(
          { _id: conversationId },
          { $set: { "lastMessage.seen": true } }
        );

        // ✅ emit theo userId (room), không cần socketId
        io.to(userId).emit("messagesSeen", { conversationId });

        const unreadCountMap = await getUnreadCountsForUser(userId);
        io.to(userId).emit("updateUnreadCounts", unreadCountMap);
      } catch (err) {
        console.error("❌ Lỗi khi đánh dấu đã xem:", err);
      }
    });

    socket.on("postLiked", ({ postId, likedBy }) => {
      console.log(`💥 Post ${postId} liked by ${likedBy}`);
    });

    socket.on("postReplied", ({ postId, reply }) => {
      console.log(`💬 New reply on post ${postId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 User disconnected: ${userId}`);
      removeUserSocket(userId);
      io.emit("getOnlineUsers", getOnlineUsers());
    });
  });
};
