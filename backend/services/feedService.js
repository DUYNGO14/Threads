import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import redis from "../config/redis.config.js";
import { setRedis } from "../utils/redisCache.js";

export const generateFeedForUser = async (userId) => {
  const user = await User.findById(userId).select(
    "following recentInteractions"
  );
  if (!user) return [];

  const tags = user.recentInteractions
    .flatMap((i) => i.postTags)
    .filter(Boolean);
  const tagCount = tags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 3);

  const [followingPosts, tagBasedPosts, trendingPosts] = await Promise.all([
    Post.find({ postedBy: { $in: user.following }, status: "approved" }).select(
      "_id"
    ),
    Post.find({
      tags: { $in: topTags },
      postedBy: { $nin: user.following },
      status: "approved",
    }).select("_id"),
    Post.find({
      createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
      status: "approved",
    }).select("_id"),
  ]);

  const allPosts = [...followingPosts, ...tagBasedPosts, ...trendingPosts];
  const uniquePostIds = [...new Set(allPosts.map((p) => p._id.toString()))];

  await setRedis(`feed:user:${userId}:recommended`, uniquePostIds, 300);
  await setRedis(
    `feed:user:${userId}:recommended:updatedAt`,
    Date.now().toString(),
    3600
  );

  return uniquePostIds;
};
export const getTrendingPosts = async (skip, limit) => {
  return await Post.aggregate([
    { $match: { status: "approved" } },
    {
      $addFields: {
        score: {
          $add: [
            { $size: "$likes" },
            { $size: "$repostedBy" },
            { $multiply: [{ $size: "$replies" }, 2] },
          ],
        },
      },
    },
    { $sort: { score: -1, createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "postedBy",
        foreignField: "_id",
        as: "postedBy",
      },
    },
    { $unwind: "$postedBy" },
    {
      $project: {
        text: 1,
        media: 1,
        likes: 1,
        repostedBy: 1,
        replies: 1,
        tags: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        postedBy: {
          _id: 1,
          username: 1,
          name: 1,
          profilePic: 1,
        },
      },
    },
  ]);
};
export const getTopTags = (interactions = []) => {
  const tags = interactions.flatMap((i) => i.postTags).filter(Boolean);
  const count = tags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 3);
};
export const fetchPostsByIds = async (postIds) => {
  const posts = await Post.find({ _id: { $in: postIds } })
    .populate("postedBy", "_id username name profilePic")
    .lean();

  const map = new Map(posts.map((p) => [p._id.toString(), p]));
  return postIds.map((id) => map.get(id)).filter(Boolean);
};
