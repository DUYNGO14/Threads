import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { getRedis, setRedis } from "../utils/redisCache.js";
import scorePost from "../utils/scorePost.js";

export const getRecommendedPosts = async (
  userId = null,
  { limit = 20, page = 1 }
) => {
  const skip = (page - 1) * limit;

  // 🧑‍💻 Khách vãng lai
  if (!userId) {
    const redisKey = `guestFeed:page:${page}`;
    const cached = await getRedis(redisKey);
    if (cached) return cached;

    const totalPosts = await Post.countDocuments({ status: "approved" });
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await Post.find({ status: "approved" })
      .sort({ likes: -1, repostedBy: -1, replies: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("postedBy", "username profilePic")
      .lean();

    const response = { posts, totalPages };
    await setRedis(redisKey, response, 1800);
    return response;
  }

  // 👤 Người dùng đã đăng nhập
  const redisKey = `recommendedFeed:user:${userId}:page:${page}`;
  const cached = await getRedis(redisKey);
  if (cached) return cached;

  const user = await User.findById(userId).select(
    "following bio recentInteractions"
  );
  if (!user) throw new Error("User not found");

  const followingIds = user.following.map((id) => id.toString());

  const candidatePosts = await Post.find({
    status: "approved",
    $or: [
      { postedBy: { $in: followingIds } },
      { repostedBy: { $in: followingIds } },
      { tags: { $exists: true, $ne: null } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(300)
    .populate("postedBy", "username profilePic")
    .lean();

  const scoredPosts = candidatePosts
    .map((p) => ({ ...p, score: scorePost(p, user) }))
    .sort((a, b) => b.score - a.score);

  const totalPages = Math.ceil(scoredPosts.length / limit);
  const pagedPosts = scoredPosts.slice(skip, skip + limit);

  const response = { posts: pagedPosts, totalPages };
  await setRedis(redisKey, response, 1800);

  return response;
};
