import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import { uploadFiles, deleteMediaFiles } from "../utils/uploadUtils.js";
import { MAX_FILES, MAX_CHAR } from "../constants/upload.js";
import { moderateTextSmart } from "../utils/moderateText.js";
import Reply from "../models/replyModel.js";
import Notification from "../models/notificationModel.js";
import getPaginationParams from "../utils/helpers/getPaginationParams.js";
import {
  setRedis,
  getRedis,
  removePostFromCache,
  appendToCache,
} from "../utils/redisCache.js";
import _ from "lodash";
import { moderateMedia } from "../utils/moderate/moderateMediaWithSightengine.js";
import { moderateTextWithSightengine } from "../utils/moderate/moderateTextWithSightengine.js";
import { formatResponse } from "../utils/formatResponse.js";
import { isMutualOrOneWayFollow } from "./userController.js";
import { updateRecentInteractions } from "../utils/recentInteraction.js";
import { getTrendingPosts } from "../services/feedService.js";
import shuffleArray from "../utils/helpers/shuffleArray.js";
import { generateFeedForUser } from "../services/feedService.js";
import { addNotificationJob } from "../queues/notification.producer.js";
import { scorePost } from "../utils/helpers/scorePost.js";
import RecentInteraction from "../models/recentInteractionModel.js";
import { addModerationJob } from "../queues/moderation.producer.js";

const createPost = async (req, res) => {
  try {
    const { postedBy, text, tags, notification } = req.body;
    const user = await User.findById(postedBy);
    if (!user)
      return res.status(404).json(formatResponse("error", "User not found"));

    if (text && text.length > MAX_CHAR) {
      return res
        .status(400)
        .json(
          formatResponse(
            "error",
            `Text must be less than ${MAX_CHAR} characters`
          )
        );
    }

    let mediaFiles = [];
    if (req.files?.length > 0) {
      if (req.files.length > MAX_FILES) {
        return res
          .status(400)
          .json(
            formatResponse(
              "error",
              `You can only upload up to ${MAX_FILES} files`
            )
          );
      }

      mediaFiles = await uploadFiles(req.files, user.username, "post");
      if (mediaFiles.length === 0) {
        return res
          .status(400)
          .json(formatResponse("error", "All media uploads failed"));
      }
    }

    const newPost = new Post({
      postedBy,
      text,
      media: mediaFiles,
      tags: tags || "",
      status: "pending",
    });
    await newPost.save();
    const populatedPost = await Post.findById(newPost._id).populate(
      "postedBy",
      "_id username name profilePic"
    );
    await addModerationJob({
      postId: newPost._id,
      text,
      media: mediaFiles,
      senderId: req.user?._id || null,
      notification,
    });

    return res
      .status(201)
      .json(
        formatResponse(
          "success",
          "Post created (pending moderation)",
          populatedPost
        )
      );
  } catch (err) {
    console.error("createPost error:", err);
    return res
      .status(500)
      .json(formatResponse("error", "Something went wrong. Try again."));
  }
};
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text, tags, postedBy } = req.body;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json(formatResponse("error", "Post not found"));
    }
    if (post.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      return res
        .status(400)
        .json(formatResponse("error", "Post is too old to edit"));
    }
    if (post.postedBy.toString() !== postedBy) {
      const user = await User.findById(postedBy);
      if (!user || user.role !== "admin") {
        return res.status(403).json(formatResponse("error", "Unauthorized"));
      }
    }

    if (text && text.length > MAX_CHAR) {
      return res
        .status(400)
        .json(
          formatResponse(
            "error",
            `Text must be less than ${MAX_CHAR} characters`
          )
        );
    }

    const moderationResult = await moderateTextWithSightengine(text || "");
    if (!moderationResult.ok) {
      return res
        .status(400)
        .json(formatResponse("error", moderationResult.message));
    }

    const cleanedText = moderationResult.cleanedText || text || "";
    post.text = cleanedText;
    post.tags = tags || "";
    await post.save();

    const populatedPost = await Post.findById(post._id).populate(
      "postedBy",
      "_id username name profilePic"
    );

    return res
      .status(200)
      .json(
        formatResponse("success", "Post updated successfully", populatedPost)
      );
  } catch (err) {
    console.error("updatePost error:", err);
    return res
      .status(500)
      .json(formatResponse("error", "Something went wrong. Try again."));
  }
};

const getPost = async (req, res) => {
  try {
    const id = req.params.id;
    const { page, limit, skip } = getPaginationParams(req);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const post = await Post.findById(id)
      .populate("postedBy", "_id username name profilePic")
      .lean();

    if (!post) {
      return res
        .status(404)
        .json({ error: "Post with the specified ID not found" });
    }

    const totalRepliesCount = post.replies.length;

    const replyIds = post.replies.slice().reverse();

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);

    const pagedReplyIds = replyIds.slice(startIndex, endIndex);

    const replies = await Reply.find({ _id: { $in: pagedReplyIds } })
      .populate("userId", "username profilePic")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({
      post: { ...post, replies: undefined }, // loại bỏ replies trong post gốc
      replies,
      totalReplies: totalRepliesCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalRepliesCount / limit),
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deletePost = async (req, res) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const post = await Post.findById(req.params.id).populate(
        "postedBy",
        "_id username name profilePic"
      );
      const keyRedis = `posts:${req.user.username}`;
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (
        post.postedBy._id.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(401).json({ error: "Unauthorized to delete post" });
      }

      await deleteMediaFiles(post.media);

      if (post.repostedBy && post.repostedBy.length > 0) {
        await User.updateMany(
          { _id: { $in: post.repostedBy } },
          { $pull: { reposts: post._id } },
          { session }
        );
      }
      await Post.findByIdAndDelete(post._id, { session });

      await removePostFromCache(keyRedis, post._id);
      await session.commitTransaction();
      if (req.user.role === "admin") {
        await addNotificationJob({
          sender: req.user._id,
          receivers: [post.postedBy._id],
          type: "report",
          content: `Your post has been deleted for violating community standards.`,
        });
      }
      return res.status(200).json({
        message: "Post deleted successfully",
        post: {
          _id: post._id,
          postedBy: post.postedBy,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const likeUnlikePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });

      await Notification.findOneAndUpdate(
        { sender: userId, receiver: post.postedBy, type: "like", post: postId },
        { isValid: false }
      );

      return res.status(200).json({ message: "Post unliked successfully" });
    }

    post.likes.push(userId);
    await post.save();
    await updateRecentInteractions(userId, postId, "like");
    const isMutualFollow = await isMutualOrOneWayFollow(userId, post.postedBy);

    if (post.postedBy.toString() !== userId.toString() && isMutualFollow) {
      await addNotificationJob({
        sender: req.user._id,
        receivers: post.postedBy,
        type: "like",
        content: "Liked your post ❤️",
        post: postId,
      });
    }

    return res.status(200).json({ message: "Post liked successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const replyToPost = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: postId } = req.params;
    const { _id: userId, profilePic: userProfilePic, username } = req.user;

    if (!text) {
      return res.status(400).json({ message: "Text field is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const cleanReply = await moderateTextSmart(text);
    if (!cleanReply.ok) {
      return res.status(400).json({ message: cleanReply.message });
    }

    const newReply = new Reply({
      userId,
      text: cleanReply.cleanedText,
      originalText: text,
      userProfilePic,
      username,
      postId,
    });

    await newReply.save();

    post.replies.push(newReply._id);
    await post.save();
    await updateRecentInteractions(userId, postId, "reply");
    const truncatedText = cleanReply.cleanedText.slice(0, 20) + "...";
    const isMutualFollow = await isMutualOrOneWayFollow(userId, post.postedBy);
    if (post.postedBy.toString() !== userId.toString() && isMutualFollow) {
      await addNotificationJob({
        sender: req.user._id,
        receivers: post.postedBy,
        type: "reply",
        content: `Replied to your post ✍: "${truncatedText}."`,
        reply: newReply._id,
        post: postId,
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Reply added successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getReposts = async (req, res) => {
  try {
    const { username } = req.params;
    const redisKey = `reposted:${username}`;
    const { page, limit, skip } = getPaginationParams(req);

    // Kiểm tra cache trước
    const cachedPostIds = await getRedis(redisKey);

    if (cachedPostIds) {
      // Nếu cache có, phân trang qua các ID bài viết
      const paginatedIds = cachedPostIds.slice(skip, skip + limit);

      // Lấy các bài viết chi tiết từ MongoDB theo ID
      const posts = await Post.find({ _id: { $in: paginatedIds } })
        .sort({ createdAt: -1 })
        .populate("postedBy", "_id username name profilePic");

      return res.json({
        page,
        limit,
        totalPosts: cachedPostIds.length,
        totalPages: Math.ceil(cachedPostIds.length / limit),
        posts,
      });
    }

    // Nếu không có cache, lấy thông tin người dùng và các bài đã repost
    const user = await User.findOne({ username }).select("_id reposts");
    if (!user) return res.status(404).json({ error: "User not found" });

    // Lưu các ID bài repost vào cache
    const postIds = user.reposts;
    await setRedis(redisKey, postIds, 900); // Cache ID bài viết trong 15 phút

    // Phân trang ID bài viết
    const paginatedIds = postIds.slice(skip, skip + limit);

    // Lấy chi tiết các bài viết từ MongoDB
    const posts = await Post.find({ _id: { $in: paginatedIds } })
      .sort({ createdAt: -1 })
      .populate("postedBy", "_id username name profilePic");

    res.status(200).json({
      page,
      limit,
      totalPosts: postIds.length,
      totalPages: Math.ceil(postIds.length / limit),
      posts,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { page, limit, skip } = getPaginationParams(req);
    const followingIds = user.following;

    const query = {
      status: "approved",
      $or: [
        { postedBy: { $in: followingIds } },
        { repostedBy: { $in: followingIds } },
      ],
    };

    const [posts, totalPosts] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("postedBy", "_id username name profilePic")
        .populate("repostedBy", "_id username name profilePic"),
      Post.countDocuments(query),
    ]);

    // Lọc bỏ các user trong repostedBy không nằm trong danh sách follow
    const filteredPosts = posts.map((post) => {
      const filteredRepostedBy = post.repostedBy.filter((user) =>
        followingIds.includes(user._id.toString())
      );
      return {
        ...post.toObject(),
        repostedBy: filteredRepostedBy,
      };
    });

    // Loại bỏ trùng lặp bài viết bằng _id (nếu có)
    const uniquePostsMap = new Map();
    filteredPosts.forEach((post) => {
      uniquePostsMap.set(post._id.toString(), post);
    });

    const uniquePosts = Array.from(uniquePostsMap.values());

    return res.status(200).json({
      page,
      limit,
      totalPosts: uniquePosts.length,
      totalPages: Math.ceil(totalPosts / limit),
      posts: uniquePosts,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);

    const query = req.user?._id
      ? { postedBy: { $ne: req.user._id }, status: "approved" }
      : { status: "approved" };

    const [posts, totalPosts] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("postedBy", "_id username name profilePic"),

      Post.countDocuments(query),
    ]);

    return res.status(200).json({
      page,
      limit,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      posts,
    });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", message: err.message });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select("_id");
    if (!user) return res.status(404).json({ error: "User not found" });
    const redisKey = `posts:${user._id}`;
    const { page, limit, skip } = getPaginationParams(req);

    // Check cache
    const cachedIds = await getRedis(redisKey);

    let postIds;

    if (cachedIds) {
      postIds = cachedIds;
    } else {
      const posts = await Post.find({ postedBy: user._id })
        .sort({ createdAt: -1 })
        .select("_id");

      postIds = posts.map((p) => p._id.toString());

      await setRedis(redisKey, postIds, 1800);
    }
    const paginatedIds = postIds.slice(skip, skip + limit);

    const posts = await Post.find({ _id: { $in: paginatedIds } }).populate(
      "postedBy",
      "_id username name profilePic"
    );

    const postsMap = posts.reduce((acc, post) => {
      acc[post._id.toString()] = post;
      return acc;
    }, {});

    const orderedPosts = paginatedIds.map((id) => postsMap[id]).filter(Boolean);

    return res.status(200).json({
      page,
      limit,
      totalPosts: postIds.length,
      totalPages: Math.ceil(postIds.length / limit),
      posts: orderedPosts,
    });
  } catch (error) {
    console.error("getUserPosts error", error);
    return res.status(500).json({ error: error.message });
  }
};

const repost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const redisKey = `reposted:${req.user.username}`;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const hasReposted = post.repostedBy.includes(userId);

      if (hasReposted) {
        await Post.findByIdAndUpdate(
          postId,
          { $pull: { repostedBy: userId } },
          { session }
        );
        await User.findByIdAndUpdate(
          userId,
          { $pull: { reposts: postId } },
          { session }
        );

        await session.commitTransaction();
        return res
          .status(200)
          .json({ message: "Post unreposted successfully" });
      } else {
        await Post.findByIdAndUpdate(
          postId,
          { $push: { repostedBy: userId } },
          { session }
        );
        await User.findByIdAndUpdate(
          userId,
          { $push: { reposts: postId } },
          { session }
        );

        await session.commitTransaction();
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    await updateRecentInteractions(userId, postId, "repost");
    const isFollowed = await isMutualOrOneWayFollow(userId, post.postedBy);
    if (isFollowed) {
      await addNotificationJob({
        sender: req.user._id,
        receivers: post.postedBy,
        type: "repost",
        content: `${req.user.username} just reposted your post.`,
        post: postId,
      });
    }

    await appendToCache(redisKey, post._id);
    return res.status(200).json({ message: "Post reposted successfully" });
  } catch (err) {
    console.error("Error in repost:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getTags = async (req, res) => {
  try {
    const userId = req.user._id;

    const userTags = await Post.aggregate([
      {
        $match: {
          postedBy: new mongoose.Types.ObjectId(userId),
          tags: { $ne: "" },
        },
      },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
    ]);
    const popularTags = await Post.aggregate([
      { $unwind: "$tags" },
      { $match: { tags: { $ne: "" } } },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const uniquePopularTags = popularTags.filter(
      (tag) => !userTags.some((userTag) => userTag._id === tag._id)
    );

    const tags = [...userTags, ...uniquePopularTags];
    const tagNames = tags.map((tag) => tag._id);
    return res.status(200).json(tagNames);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

const getFeed = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { page, limit, skip } = getPaginationParams(req);

    const blockedUsers = await User.find({
      $or: [{ isFrozen: true }, { isBlocked: true }],
    }).select("_id");
    const blockedIds = blockedUsers.map((u) => u._id.toString());
    if (userId) blockedIds.push(userId.toString());

    if (!userId) {
      const trendingPosts = await getTrendingPosts(skip, limit);
      return res.json({
        posts: trendingPosts,
        hasMore: trendingPosts.length === limit,
      });
    }

    let cachedIds = await getRedis(`feed:user:${userId}:recommended`);
    if (!cachedIds) {
      await generateFeedForUser(userId);
      cachedIds = await getRedis(`feed:user:${userId}:recommended`);
    }

    let postIds = cachedIds || "[]";
    // postIds = shuffleArray(postIds);
    const paginatedIds = postIds.slice(skip, skip + parseInt(limit));

    const posts = await Post.find({ _id: { $in: paginatedIds } })
      .populate("postedBy", "_id username name profilePic")
      .lean();

    return res.json({ posts, hasMore: postIds.length > skip + limit });
  } catch (err) {
    console.error("❌ Error in getFeed:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getRecommendPost = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    // const cacheKey = `feed:user:${userId}:recommended`;

    // 1. Lấy tương tác gần đây
    const recentInteractions = await RecentInteraction.find({ user: userId })
      .sort({ interactedAt: -1 })
      .limit(50)
      .lean();

    const interactedPostOwners = new Set();
    const interactedTags = new Set();

    for (const interaction of recentInteractions) {
      if (interaction.postOwner)
        interactedPostOwners.add(interaction.postOwner.toString());
      for (const tag of interaction.postTags || []) {
        interactedTags.add(tag);
      }
    }

    // 2. Lấy danh sách người đang follow
    const user = await User.findById(userId).select("following").lean();
    const followingIds = new Set(user.following.map((id) => id.toString()));

    // 3. Truy vấn bài viết đã duyệt gần đây
    const candidatePosts = await Post.find({ status: "approved" })
      .select("postedBy tags createdAt likes repostedBy")
      .limit(200)
      .lean();

    const result = [];

    // 4. Tính điểm từng bài viết
    for (const post of candidatePosts) {
      const score = scorePost({
        post,
        userFollowingSet: followingIds,
        interactedUserSet: interactedPostOwners,
        interactedTagsSet: interactedTags,
      });

      if (score > 0) {
        result.push({ postId: post._id.toString(), score });
      }
    }

    // 5. Sắp xếp và lưu vào Redis
    const sortedPostIds = result
      .sort((a, b) => b.score - a.score)
      .map((item) => item.postId);

    // await redis.set(cacheKey, JSON.stringify(sortedPostIds), {
    //   ex: 60 * 60, // TTL 1 tiếng
    // });

    // 6. Trả về kết quả
    return res.status(200).json({ postIds: sortedPostIds });
  } catch (err) {
    console.error("Error generating recommended feed:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
export {
  createPost,
  getPost,
  deletePost,
  likeUnlikePost,
  replyToPost,
  getFollowingPosts,
  getUserPosts,
  getReposts,
  getAllPosts,
  updatePost,
  repost,
  getTags,
  getFeed,
  getRecommendPost,
};
