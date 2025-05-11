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
    const { conversationId, message } = req.body;
    const senderId = req.user._id;
    const files = req.files;

    if (!conversationId) {
      return res.status(400).json({ error: "Missing conversationId" });
    }

    if (!message && (!files || files.length === 0)) {
      return res.status(400).json({ error: "Message or media is required" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Kiểm tra nếu người dùng không nằm trong đoạn chat
    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({ error: "You are not a participant" });
    }
    // Nếu người dùng đã xóa cuộc trò chuyện, gỡ khỏi deletedBy
    const updated = removeFromDeletedBy(conversation, [senderId]);
    if (updated) await conversation.save();

    // Upload media nếu có
    let media = [];
    if (files && files.length > 0) {
      media = await uploadFiles(files, req.user.username, "message");
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
    const resultMessage = await newMessage.save();
    await conversation.updateOne({
      $set: {
        lastMessage: {
          _id: resultMessage._id,
          text: message,
          sender: senderId,
          seen: false,
          media,
          createdAt: new Date(),
        },
        updatedAt: new Date(),
      },
    });
    const result = await Message.findById(resultMessage._id).populate(
      "sender",
      "_id username name profilePic"
    );
    // Gửi socket đến các thành viên trong cuộc trò chuyện (trừ người gửi)
    const recipientIds = conversation.participants.filter(
      (id) => id.toString() !== senderId.toString()
    );

    for (const rId of recipientIds) {
      const socketId = getRecipientSocketId(rId);
      if (socketId) {
        io.to(socketId).emit("newMessage", result);

        const unreadCounts = await getUnreadCountsForUser(rId);
        io.to(socketId).emit("updateUnreadCounts", unreadCounts);
      }
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// Lấy tất cả tin nhắn giữa user và người còn lại
async function getMessages(req, res) {
  const { conversationId, otherUserId } = req.query; // hỗ trợ cả group và 1-1
  const userId = req.user?._id;

  try {
    let conversation;

    // Ưu tiên tìm theo conversationId (group hoặc 1-1 đều được)
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });
    } else if (otherUserId) {
      // Nếu không có conversationId thì tìm theo 2 người
      conversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [userId, otherUserId], $size: 2 },
      });
    } else {
      return res
        .status(400)
        .json({ error: "Missing conversationId or otherUserId" });
    }

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    })
      .populate("sender", "username profilePic")
      .sort({ createdAt: 1 });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
// async function getMessages(req, res) {
//   const { conversationId, otherUserId, limit = 20, skip = 0 } = req.query; // Thêm limit và skip với giá trị mặc định
//   const userId = req.user?._id;

//   try {
//     let conversation;

//     // Ưu tiên tìm theo conversationId (group hoặc 1-1 đều được)
//     if (conversationId) {
//       conversation = await Conversation.findOne({
//         _id: conversationId,
//         participants: userId,
//       });
//     } else if (otherUserId) {
//       // Nếu không có conversationId thì tìm theo 2 người
//       conversation = await Conversation.findOne({
//         isGroup: false,
//         participants: { $all: [userId, otherUserId], $size: 2 },
//       });
//     } else {
//       return res
//         .status(400)
//         .json({ error: "Missing conversationId or otherUserId" });
//     }

//     if (!conversation) {
//       return res.status(404).json({ error: "Conversation not found" });
//     }

//     // Lấy tổng số tin nhắn để biết còn tin nhắn cũ hơn không
//     const totalMessages = await Message.countDocuments({
//       conversationId: conversation._id,
//     });

//     const messages = await Message.find({
//       conversationId: conversation._id,
//     })
//       .populate("sender", "username profilePic")
//       .sort({ createdAt: -1 }) // Sắp xếp giảm dần theo thời gian
//       .skip(parseInt(skip))
//       .limit(parseInt(limit));

//     // Đảo ngược mảng để hiển thị tin nhắn cũ nhất lên trước
//     const sortedMessages = messages.reverse();

//     return res.status(200).json({
//       messages: sortedMessages,
//       hasMore: totalMessages > parseInt(skip) + parseInt(limit),
//       totalMessages,
//     });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// }
const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user?._id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (!message.sender.equals(userId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this message" });
    }

    if (message.media && message.media.length > 0) {
      await deleteMediaFiles(message.media);
    }
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    const isLastMessage = conversation.lastMessage._id.toString() === messageId;
    await message.deleteOne();
    if (isLastMessage) {
      const newLastMessage = await Message.findOne({
        conversationId: message.conversationId,
      })
        .sort({ createdAt: -1 })
        .exec();

      // Nếu không còn tin nhắn nào trong cuộc trò chuyện, không cập nhật lastMessage
      if (newLastMessage) {
        await Conversation.findByIdAndUpdate(
          message.conversationId,
          {
            $set: {
              lastMessage: {
                _id: newLastMessage._id,
                text: newLastMessage.text,
                sender: newLastMessage.sender,
                seen: newLastMessage.seen,
                media: newLastMessage.media,
                createdAt: newLastMessage.createdAt,
              },
            },
            updatedAt: new Date(),
          },
          { new: true }
        );
      } else {
        // Nếu không còn tin nhắn nào, có thể set lastMessage về null hoặc một giá trị mặc định
        await Conversation.findByIdAndUpdate(
          message.conversationId,
          {
            $set: {
              lastMessage: null,
            },
            updatedAt: new Date(),
          },
          { new: true }
        );
      }
    }
    io.to(message.conversationId).emit("unsendMessage", {
      conversationId: message.conversationId,
      messageId,
    });

    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("❌ Delete message error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
const updatedMessage = async (req, res) => {
  const { messageId } = req.params;
  const { text } = req.body;
  const userId = req.user?._id;

  if (!text?.trim()) {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (!message.sender.equals(userId)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    message.text = text;
    // message.editedAt = new Date();
    await message.save();
    await Conversation.findOneAndUpdate(
      { _id: message.conversationId },
      {
        $set: {
          lastMessage: {
            _id: message._id,
            text: message.text,
            sender: senderId,
            seen: false,
            media: message.media,
            createdAt: new Date(),
          },
          updatedAt: new Date(),
        },
      },
      { new: true }
    );
    io.to(message.conversationId).emit("updateMessage", {
      conversationId: message.conversationId,
      messageId,
      text,
    });
    return res.status(200).json({
      message: "Message updated successfully",
      updatedMessage: message,
    });
  } catch (error) {
    console.error("Update message error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export { sendMessage, getMessages, deleteMessage, updatedMessage };
