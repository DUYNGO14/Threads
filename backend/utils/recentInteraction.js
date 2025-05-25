// utils/recentInteraction.js
import User from "../models/userModel.js";
import Post from "../models/postModel.js";

export const updateRecentInteractions = async (userId, postId, type) => {
  try {
    const [user, post] = await Promise.all([
      User.findById(userId).select("recentInteractions"),
      Post.findById(postId).select("postedBy tags"),
    ]);

    if (!user || !post) return;

    user.recentInteractions = user.recentInteractions.filter(
      (entry) => entry.postId.toString() !== postId.toString()
    );

    user.recentInteractions.unshift({
      postId,
      type,
      interactedAt: new Date(),
      postOwner: post.postedBy,
      postTags: post.tags || [],
    });

    if (user.recentInteractions.length > 100) {
      user.recentInteractions = user.recentInteractions.slice(0, 100);
    }

    await user.save();
  } catch (err) {
    console.error("updateRecentInteractions error:", err.message);
  }
};
