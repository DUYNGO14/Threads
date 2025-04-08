import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";

const userSocketMap = {}; // userId: socketId

export const socketHandler = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("Connected user:", userId);
    if (userId && userId !== "undefined") {
      userSocketMap[userId] = socket.id;
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }

    socket.on("markMessagesAsSeen", async ({ conversationId, userId }) => {
      try {
        await Message.updateMany(
          { conversationId, seen: false },
          { $set: { seen: true } }
        );
        await Conversation.updateOne(
          { _id: conversationId },
          { $set: { "lastMessage.seen": true } }
        );
        io.to(userSocketMap[userId]).emit("messagesSeen", { conversationId });
      } catch (err) {
        console.error("Seen error:", err);
      }
    });

    socket.on("disconnect", () => {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });
};

export const getRecipientSocketId = (recipientId) => {
  return userSocketMap[recipientId];
};
