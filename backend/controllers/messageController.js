import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { io } from "../setup/setupServer.js";
import { getRecipientSocketId } from "../utils/socketUsers.js";
import { getUnreadCountsForUser } from "../utils/getUnreadCounts.js";
import { uploadFiles } from "../utils/uploadUtils.js";
import removeFromDeletedBy from "../utils/helpers/removeFromDeletedBy.js";
// Gửi tin nhắn mới
async function sendMessage(req, res) {
  try {
    const { recipientId, message } = req.body;
    const senderId = req.user._id;
    const files = req.files;
    console.log(recipientId);
    if (!recipientId || (!message && files.length === 0)) {
      return res
        .status(400)
        .json({ error: "Recipient and message are required." });
    }

    // Tìm hoặc tạo conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, recipientId],
        deletedBy: [],
        lastMessage: {
          text: message,
          sender: senderId,
        },
      });
      await conversation.save();
    }

    // Nếu cuộc trò chuyện bị ẩn bởi sender hoặc recipient thì hiển thị lại
    const updated = removeFromDeletedBy(conversation, [senderId, recipientId]);
    if (updated) await conversation.save();

    // Upload media nếu có
    let media = [];
    if (files && files.length > 0) {
      media = await uploadFiles(files);
    }

    // Tạo tin nhắn mới
    const newMessage = new Message({
      conversationId: conversation._id,
      sender: senderId,
      text: message,
      media,
      seen: false,
    });

    // Cập nhật lastMessage cho conversation
    await Promise.all([
      newMessage.save(),
      conversation.updateOne({
        $set: {
          lastMessage: {
            text: message,
            sender: senderId,
            seen: false,
            img: media.find((m) => m.type === "image")?.url || "",
            video: media.find((m) => m.type === "video")?.url || "",
            audio: media.find((m) => m.type === "audio")?.url || "",
            createdAt: new Date(),
          },
          updatedAt: new Date(),
        },
      }),
    ]);

    // Gửi socket tới recipient nếu đang online
    const recipientSocketId = getRecipientSocketId(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("newMessage", newMessage);
    } else {
      console.log(`User ${recipientId} is offline`);
    }

    // Cập nhật số tin chưa đọc
    const unreadCounts = await getUnreadCountsForUser(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("updateUnreadCounts", unreadCounts);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Lấy tất cả tin nhắn giữa user và người còn lại
async function getMessages(req, res) {
  const { otherUserId } = req.params;
  const userId = req.user._id;
  try {
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export { sendMessage, getMessages };
