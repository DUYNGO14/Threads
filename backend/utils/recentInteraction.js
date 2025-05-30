// utils/recentInteraction.js
import RecentInteraction from "../models/recentInteractionModel.js";
import Post from "../models/postModel.js";

export const updateRecentInteractions = async (userId, postId, type) => {
  try {
    const post = await Post.findById(postId).select("postedBy tags");
    if (!post) return;

    // Xóa bản ghi cũ (nếu đã tương tác với post này)
    await RecentInteraction.deleteMany({ user: userId, postId });

    // Tạo bản ghi mới
    await RecentInteraction.create({
      user: userId,
      postId,
      type,
      postOwner: post.postedBy,
      postTags: post.tags || [],
      interactedAt: new Date(),
    });

    // Giới hạn tối đa 100 tương tác gần nhất
    const count = await RecentInteraction.countDocuments({ user: userId });
    if (count > 100) {
      const toDelete = await RecentInteraction.find({ user: userId })
        .sort({ interactedAt: 1 }) // cũ nhất trước
        .limit(count - 100)
        .select("_id");

      await RecentInteraction.deleteMany({
        _id: { $in: toDelete.map((i) => i._id) },
      });
    }
  } catch (err) {
    console.error("updateRecentInteractions error:", err.message);
  }
};
