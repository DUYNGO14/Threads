import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { getUnreadCountsForUser } from "../utils/getUnreadCounts.js";
import User from "../models/userModel.js";
import { getRecipientSocketId, io } from "../setup/setupServer.js";
import { deleteMediaFiles } from "../utils/uploadUtils.js";
export const initiateConversation = async (req, res) => {
  const userId = req.user._id;
  const { receiverId } = req.body;

  if (!receiverId)
    return res.status(400).json({ error: "Receiver ID is required" });
  if (userId.toString() === receiverId)
    return res.status(400).json({ error: "You cannot message yourself" });

  try {
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [userId, receiverId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, receiverId],
        lastMessage: null,
      });
      await conversation.save();
    }

    conversation = await conversation.populate("participants", "-password");
    return res.status(200).json(conversation);
  } catch (err) {
    console.error("Error initiating conversation:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export const createGroupConversation = async (req, res) => {
  const userId = req.user._id;
  const { groupName, participants } = req.body;

  if (!participants || !Array.isArray(participants)) {
    return res.status(400).json({ error: "Participants are required." });
  }

  if (participants.length < 2) {
    return res
      .status(400)
      .json({ error: "Group must have at least 3 members including you." });
  }

  try {
    // Thêm người tạo nhóm (admin) vào danh sách participants
    const allParticipants = [...new Set([...participants, userId.toString()])];

    // Nếu không có groupName thì tạo theo tên 2 người đầu tiên
    let finalGroupName = groupName;
    if (!finalGroupName) {
      // Lấy thông tin hai thành viên đầu tiên
      const users = await User.find({ _id: { $in: allParticipants } }).select(
        "username"
      );
      const names = users.slice(0, 2).map((u) => u.username);
      finalGroupName = names.join(", ") + (users.length > 2 ? ",..." : "");
    }

    const newGroup = await Conversation.create({
      groupName: finalGroupName,
      participants: allParticipants,
      groupAdmin: userId,
      isGroup: true,
    });

    await newGroup.populate([{ path: "participants", select: "-password" }]);

    const recipientIds = allParticipants.filter(
      (id) => id.toString() !== userId.toString()
    );

    for (const rId of recipientIds) {
      const socketId = getRecipientSocketId(rId);
      if (socketId) {
        io.to(socketId).emit("newGroup", newGroup);
      }
    }
    return res.status(201).json(newGroup);
  } catch (err) {
    console.error("Error creating group conversation:", err);
    return res.status(500).json({ error: "Internal server error" });
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
      const messages = await Message.find({ conversationId: conversationId });
      const allMedia = messages.flatMap((msg) => msg.media || []);
      if (allMedia.length > 0) {
        await deleteMediaFiles(allMedia);
      }
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
    return res.status(500).json({ error: "Internal server error" });
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
        select: "_id username name profilePic",
      })
      .sort({ updatedAt: -1 });

    const unreadCounts = await getUnreadCountsForUser(userId);

    const enrichedConversations = conversations.map((conv) => {
      const unreadCount = unreadCounts[conv._id] || 0;

      const result = {
        _id: conv._id,
        participants: [],
        isGroup: conv.isGroup,
        lastMessage: conv.lastMessage,
        createdAt: conv.createdAt,
        unreadCount,
      };

      if (conv.isGroup) {
        // Group: trả về toàn bộ thành viên + thông tin nhóm
        result.participants = conv.participants;
        result.groupName = conv.groupName;
        result.groupAdmin = conv.groupAdmin;
      } else {
        // 1-1: chỉ trả về người còn lại
        const otherParticipant = conv.participants.find(
          (p) => p._id.toString() !== userId.toString()
        );
        result.participants = [otherParticipant];
      }

      return result;
    });

    return res.status(200).json(enrichedConversations);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const leaveGroupConversation = async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.params;

  if (!conversationId)
    return res.status(400).json({ error: "Conversation ID is required" });

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });

    if (!conversation.isGroup)
      return res.status(400).json({ error: "Conversation is not a group" });
    if (conversation.groupAdmin.equals(userId)) {
      return res.status(400).json({ error: "You are the group admin" });
    }
    if (conversation.participants.some((p) => p.equals(userId))) {
      conversation.participants = conversation.participants.filter(
        (p) => !p.equals(userId)
      );
      await conversation.save();
      const systemMessage = await Message.create({
        conversationId: conversation._id,
        sender: null, // system
        text: `${req.user.username} has out of the group.`,
        isSystem: true,
        systemType: "leave",
      });
      io.to(conversationId).emit("newMessage", systemMessage);
      return res.status(200).json({ message: "Left group successfully" });
    } else {
      return res.status(400).json({ error: "You are not in this group" });
    }
  } catch (err) {
    console.error("Error leaving group conversation:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export const addMembersToGroup = async (req, res) => {
  const userId = req.user._id.toString();
  const { conversationId } = req.params;
  const { newMembersIds } = req.body;

  if (!conversationId || !newMembersIds) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });

    if (!conversation.isGroup) {
      return res.status(400).json({ error: "Not a group conversation" });
    }

    if (conversation.groupAdmin.toString() !== userId) {
      return res.status(403).json({ error: "Only the admin can add members" });
    }

    const newMembers = newMembersIds.filter(
      (newMember) =>
        !conversation.participants.some((id) => id.toString() === newMember)
    );

    if (newMembers.length === 0) {
      return res.status(400).json({ error: "No new members to add" });
    }

    conversation.participants = [...conversation.participants, ...newMembers];
    await conversation.save();
    const systemMessage = await Message.create({
      conversationId: conversation._id,
      sender: null, // System
      text: `${newMembers.length} member(s) have joined the group.`,
      isSystem: true,
      systemType: "join",
    });
    io.to(conversationId).emit("newMessage", systemMessage);
    // 🔥 Populate thông tin user sau khi thêm
    const updatedConversation = await Conversation.findById(conversation._id)
      .populate({
        path: "participants",
        select: "_id username name profilePic",
      })
      .lean();
    for (const rId of newMembersIds) {
      const socketId = getRecipientSocketId(rId);
      if (socketId) {
        io.to(socketId).emit("addUserToGroup", {
          conversation: updatedConversation,
          sender: req.user,
        });
      }
    }
    return res.status(200).json({
      message: "Members added successfully",
      conversation: updatedConversation,
    });
  } catch (err) {
    console.error("Add members error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const removeUserFromGroup = async (req, res) => {
  const userId = req.user._id.toString();
  const { conversationId } = req.params;
  const { userIdToRemove } = req.body;
  if (!conversationId || !userIdToRemove) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const userRemone = await User.findById(userIdToRemove);
    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });

    if (!conversation.isGroup) {
      return res.status(400).json({ error: "Not a group conversation" });
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === userId
    );
    if (!isParticipant) {
      return res.status(403).json({ error: "You are not a participant" });
    }

    const isUserInGroup = conversation.participants.some(
      (id) => id.toString() === userIdToRemove
    );
    if (!isUserInGroup) {
      return res
        .status(400)
        .json({ error: "User to remove is not in the group" });
    }

    if (conversation.groupAdmin.toString() === userIdToRemove) {
      return res.status(400).json({ error: "Cannot remove the group admin" });
    }

    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== userIdToRemove
    );
    await conversation.save();
    const systemMessage = await Message.create({
      conversationId: conversation._id,
      sender: null, // system
      text: `${userRemone.username} has been removed from the group.`,
      isSystem: true,
      systemType: "kick",
    });
    const socketId = getRecipientSocketId(userIdToRemove);
    io.to(socketId).emit("kickUser", { conversationId, userIdToRemove });
    io.to(conversationId).emit("newMessage", systemMessage);
    return res.status(200).json({ message: "User removed successfully" });
  } catch (err) {
    console.error("Remove member error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteGroupConversation = async (req, res) => {
  const userId = req.user._id.toString();
  const { conversationId } = req.params;

  if (!conversationId) {
    return res.status(400).json({ error: "Conversation ID is required" });
  }

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });

    if (!conversation.isGroup) {
      return res.status(400).json({ error: "Not a group conversation" });
    }

    if (conversation.groupAdmin.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Only the admin can delete the group" });
    }

    const messages = await Message.find({ conversationId: conversationId });
    const allMedia = messages.flatMap((msg) => msg.media || []);
    if (allMedia.length > 0) {
      await deleteMediaFiles(allMedia);
    }
    await Promise.all([
      Message.deleteMany({ conversation: conversationId }),
      conversation.deleteOne(),
    ]);
    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error("Delete group error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateNameGroup = async (req, res) => {
  const userId = req.user._id.toString();
  const { conversationId } = req.params;
  const { name } = req.body;

  if (!conversationId || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });

    if (!conversation.isGroup) {
      return res.status(400).json({ error: "Not a group conversation" });
    }

    if (conversation.groupAdmin.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Only the admin can update the group name" });
    }

    conversation.groupName = name;
    io.to(conversationId).emit("updateGroupName", {
      conversationId,
      groupNameNew: conversation.groupName,
    });
    await conversation.save();
    return res.status(200).json({ message: "Group name updated successfully" });
  } catch (err) {
    console.error("Update group name error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
