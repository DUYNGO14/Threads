import mongoose from "mongoose";
import Message from "../models/messageModel.js";

export async function getUnreadCountsForUser(userId) {
  const objectUserId = new mongoose.Types.ObjectId(userId);

  const unreadCounts = await Message.aggregate([
    {
      $match: {
        seen: false,
        sender: { $ne: objectUserId },
      },
    },
    {
      $lookup: {
        from: "conversations",
        localField: "conversationId",
        foreignField: "_id",
        as: "conversation",
      },
    },
    { $unwind: "$conversation" },
    {
      $match: {
        "conversation.participants": objectUserId,
      },
    },
    {
      $group: {
        _id: "$conversationId",
        count: { $sum: 1 },
      },
    },
  ]);

  // Chuyển mảng thành map { conversationId: count }
  return Object.fromEntries(
    unreadCounts.map(({ _id, count }) => [_id.toString(), count])
  );
}
