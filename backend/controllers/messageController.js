import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { io } from "../setup/setupServer.js";
import { getRecipientSocketId } from "../utils/socketUsers.js";
import { getUnreadCountsForUser } from "../utils/getUnreadCounts.js";
import { uploadFiles } from "../utils/uploadUtils.js";
import removeFromDeletedBy from "../utils/helpers/removeFromDeletedBy.js";

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

    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({ error: "You are not a participant" });
    }
    const updated = removeFromDeletedBy(conversation, [senderId]);
    if (updated) await conversation.save();

    let media = [];
    if (files && files.length > 0) {
      media = await uploadFiles(files, req.user.username, "message");
    }

    const newMessage = new Message({
      conversationId: conversation._id,
      sender: senderId,
      text: message,
      media,
      seen: false,
    });

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

async function getMessages(req, res) {
  const { conversationId, otherUserId, before } = req.query;
  const userId = req.user?._id;
  const limit = 20;

  try {
    let conversation;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });
    } else if (otherUserId) {
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
    const userDeleteEntry = conversation.deletedBy.find((entry) =>
      entry.userId.equals(userId)
    );

    const filter = {
      conversationId: conversation._id,
    };

    if (userDeleteEntry) {
      filter.createdAt = { $gt: userDeleteEntry.deletedAt };
    }

    if (before) {
      filter.createdAt = {
        ...filter.createdAt,
        $lt: new Date(before),
      };
    }

    const messages = await Message.find(filter)
      .populate("sender", "username profilePic")
      .sort({ createdAt: -1 })
      .limit(limit);

    const reversed = messages.reverse();

    return res.status(200).json({
      messages: reversed,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
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
