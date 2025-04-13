import mongoose from "mongoose"; // nhớ import nếu chưa có
import Message from "../models/messageModel.js";
export async function getUnreadCountsForUser(userId) {
  const objectUserId = new mongoose.Types.ObjectId(userId); // chuyển đổi

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
    {
      $unwind: "$conversation",
    },
    {
      $match: {
        "conversation.participants": objectUserId, // dùng ObjectId
      },
    },
    {
      $group: {
        _id: "$conversationId",
        count: { $sum: 1 },
      },
    },
  ]);

  const unreadCountMap = {};
  unreadCounts.forEach((item) => {
    unreadCountMap[item._id.toString()] = item.count;
  });

  return unreadCountMap;
}
