import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { getUnreadCountsForUser } from "../utils/getUnreadCounts.js";
export const initiateConversation = async (req, res) => {
  const userId = req.user._id;
  const { receiverId } = req.body;

  if (!receiverId)
    return res.status(400).json({ error: "Receiver ID is required" });
  if (userId.toString() === receiverId)
    return res.status(400).json({ error: "You cannot message yourself" });

  try {
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, receiverId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, receiverId],
      });
      await conversation.save();
    }

    conversation = await conversation.populate("participants", "-password");

    res.status(200).json(conversation);
  } catch (err) {
    console.error("Error initiating conversation:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteConversation = async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.params;

  if (!conversationId)
    return res.status(400).json({ error: "Conversation ID is required" });

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });

    const isParticipant = conversation.participants.some((id) =>
      id.equals(userId)
    );
    if (!isParticipant)
      return res.status(403).json({ error: "Not authorized" });

    const alreadyDeleted = conversation.deletedBy.some((id) =>
      id.equals(userId)
    );

    if (!alreadyDeleted) {
      conversation.deletedBy.push(userId);
    }

    const allParticipantsDeleted = conversation.participants.every((id) =>
      conversation.deletedBy.some((delId) => delId.equals(id))
    );

    if (allParticipantsDeleted) {
      // Xoá tất cả message liên quan
      await Promise.all([
        Message.deleteMany({ conversationId: conversation._id }),
        conversation.deleteOne(),
      ]);
      return res
        .status(200)
        .json({ message: "Conversation and messages deleted permanently" });
    } else {
      await conversation.save();
      return res
        .status(200)
        .json({ message: "Conversation hidden successfully" });
    }
  } catch (err) {
    console.error("Error deleting conversation:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getConversations = async (req, res) => {
  const userId = req.user._id;
  try {
    const conversations = await Conversation.find({
      participants: userId,
      deletedBy: { $ne: userId },
    })
      .populate({
        path: "participants",
        select: "username profilePic",
      })
      .sort({ updatedAt: -1 });

    const unreadCounts = await getUnreadCountsForUser(userId);

    const enrichedConversations = conversations.map((conv) => {
      const unreadCount = unreadCounts[conv._id] || 0;
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      return {
        _id: conv._id,
        participants: [otherParticipant],
        lastMessage: conv.lastMessage,
        createdAt: conv.createdAt,
        unreadCount,
      };
    });
    res.status(200).json(enrichedConversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createGroupChat = async (req, res) => {
  const { groupName, participants, userId } = req.body;

  try {
    // Kiểm tra xem tất cả người tham gia có tồn tại không
    const usersExist = await User.find({ _id: { $in: participants } });
    if (usersExist.length !== participants.length) {
      return res.status(400).send("Một hoặc nhiều người dùng không tồn tại");
    }

    // Tạo nhóm chat mới
    const newGroup = new Conversation({
      participants: [userId, ...participants],
      groupName,
      groupAdmin: userId,
      isGroup: true,
    });

    await newGroup.save();

    // Tải thông tin người tham gia (trừ người tạo)
    const populatedGroup = await newGroup.populate({
      path: "participants",
      select: "username profilePic",
    });

    res.status(201).json(populatedGroup);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
