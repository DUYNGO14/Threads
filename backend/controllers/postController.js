import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import { uploadFiles, deleteMediaFiles } from "../utils/uploadUtils.js";
import { MAX_FILES, MAX_CHAR } from "../constants/upload.js";
import { moderateTextSmart } from "../utils/moderateText.js";
import Reply from "../models/replyModel.js";
import Notification from "../models/notificationModel.js";
import { LIMIT_PAGINATION_REPLY } from "../constants/pagination.js";
import getPaginationParams from "../utils/helpers/getPaginationParams.js";
import {
  setRedis,
  getRedis,
  removePostFromCache,
  appendToCache,
  deleteRedis,
} from "../utils/redisCache.js";
import { moderateMedia } from "../utils/moderate/moderateMediaWithSightengine.js";
import { moderateTextWithSightengine } from "../utils/moderate/moderateTextWithSightengine.js";
import { sendNotification } from "../services/notificationService.js";
import { formatResponse } from "../utils/formatResponse.js";
import { isMutualOrOneWayFollow } from "./userController.js";
const createPost = async (req, res) => {
  try {
    const { postedBy, text, tags } = req.body;
    const user = await User.findById(postedBy);

    if (!user) {
      return res.status(404).json(formatResponse("error", "User not found"));
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

      for (const file of mediaFiles) {
        if (file.type === "image") {
          const moderation = await moderateMedia(file.url, file.type);
          if (!moderation.ok) {
            await deleteMediaFiles(mediaFiles);
            return res
              .status(400)
              .json(
                formatResponse(
                  "error",
                  `Media moderation failed: ${file.type} contains unsafe content`
                )
              );
          }
        }
      }
    }

    const newPost = new Post({
      postedBy,
      text: cleanedText,
      media: mediaFiles,
      status: "approved",
      tags: tags, // Chuyển đổi chuỗi JSON thành mảng
    });

    await newPost.save();

    const populatedPost = await Post.findById(newPost._id).populate(
      "postedBy",
      "_id username name profilePic"
    );
    await appendToCache(`posts:${user.username}`, populatedPost);
    return res
      .status(201)
      .json(
        formatResponse("success", "Post created successfully", populatedPost)
      );
  } catch (err) {
    return res
      .status(500)
      .json(formatResponse("error", "Something went wrong. Try again."));
  }
};

const updatePost = async (req, res) => {
  try {
    const id = req.params.id;
    const redisKey = `posts:${req.user.username}`;
    const { text, deleteMedia } = req.body; // Nhận các public_id của media cần xóa
    cons;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Kiểm tra quyền sở hữu bài viết
    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: "Unauthorized to update post" });
    }

    // Nếu có text mới, cập nhật text
    if (text) {
      post.text = text;
    }

    // Nếu có các tệp media mới, xử lý thêm vào
    if (req.files && req.files.length > 0) {
      const uploadedMedia = await uploadFiles(req.files);
      post.media = post.media.concat(uploadedMedia);
    }

    // Kiểm tra các media cũ để xóa (so với media trong `post.media`)
    if (deleteMedia && deleteMedia.length > 0) {
      // Xóa các media khỏi Cloudinary
      const deletePromises = deleteMedia.map((publicId) =>
        deleteMediaFromCloudinary(publicId)
      );

      await Promise.all(deletePromises);

      // Cập nhật lại dữ liệu bài viết để loại bỏ các media đã xóa
      post.media = post.media.filter(
        (media) => !deleteMedia.includes(media.public_id)
      );
    }

    // Lưu bài viết đã cập nhật
    await post.save();
    await deleteRedis(redisKey);
    return res.status(200).json(post);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPost = async (req, res) => {
  try {
    const id = req.params.id;
    const { page = 1, limit = LIMIT_PAGINATION_REPLY } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Lấy bài viết nhưng KHÔNG populate replies
    const post = await Post.findById(id)
      .populate("postedBy", "_id username name profilePic")
      .lean(); // dùng .lean() để hiệu suất tốt hơn

    if (!post) {
      return res
        .status(404)
        .json({ error: "Post with the specified ID not found" });
    }

    // Lấy tổng số replies
    const totalRepliesCount = post.replies.length;

    // Lấy replies với phân trang, sắp xếp theo createdAt giảm dần
    const replyIds = post.replies.slice().reverse(); // đảo mảng để lấy từ mới nhất

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);

    const pagedReplyIds = replyIds.slice(startIndex, endIndex);

    const replies = await Reply.find({ _id: { $in: pagedReplyIds } })
      .populate("userId", "username profilePic")
      .sort({ createdAt: -1 })
      .lean();

    // Trả post + replies phân trang riêng
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

      // Xóa post ID khỏi mảng reposts của tất cả users đã repost
      if (post.repostedBy && post.repostedBy.length > 0) {
        await User.updateMany(
          { _id: { $in: post.repostedBy } },
          { $pull: { reposts: post._id } },
          { session }
        );
      }

      // Xóa bài viết
      await Post.findByIdAndDelete(post._id, { session });

      await removePostFromCache(keyRedis, post._id);
      await session.commitTransaction();
      if (req.user.role === "admin") {
        console.log(req.user.role);
        console.log(post.postedBy);
        await sendNotification({
          sender: req.user,
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
      // Unlike
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });

      // Không xóa, chỉ đánh dấu isValid: false
      await Notification.findOneAndUpdate(
        { sender: userId, receiver: post.postedBy, type: "like", post: postId },
        { isValid: false }
      );

      return res.status(200).json({ message: "Post unliked successfully" });
    }

    // Like
    post.likes.push(userId);
    await post.save();

    const isMutualFollow = await isMutualOrOneWayFollow(userId, post.postedBy);

    // Không tự gửi thông báo cho mình
    if (post.postedBy.toString() !== userId.toString() && isMutualFollow) {
      await sendNotification({
        sender: req.user,
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

    const truncatedText = cleanReply.cleanedText.slice(0, 20) + "...";
    const isMutualFollow = await isMutualOrOneWayFollow(userId, post.postedBy);
    if (post.postedBy.toString() !== userId.toString() && isMutualFollow) {
      await sendNotification({
        sender: req.user,
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

// Lấy reposts của user
const getReposts = async (req, res) => {
  try {
    const { username } = req.params;
    const redisKey = `reposted:${username}`;
    const { page, limit, skip } = getPaginationParams(req);

    const cached = await getRedis(redisKey); // Kiểm tra cache (nếu đã có)

    if (cached) {
      // Nếu dữ liệu có trong cache, phân trang và trả về
      const paginated = cached.slice(skip, skip + limit);
      return res.json({
        page,
        limit,
        totalPosts: cached.length,
        totalPages: Math.ceil(cached.length / limit),
        posts: paginated,
      });
    }

    // Tìm người dùng và lấy danh sách các bài viết đã repost
    const user = await User.findOne({ username }).select("_id reposts");
    if (!user) return res.status(404).json({ error: "User not found" });

    // Lấy tất cả các bài đăng mà người dùng đã repost
    const posts = await Post.find({ _id: { $in: user.reposts } })
      .sort({ createdAt: -1 })
      .populate("postedBy", "_id username name profilePic");

    await setRedis(redisKey, posts, 1800); // Cache kết quả trong 30 phút

    // Phân trang bài viết
    const paginated = posts.slice(skip, skip + limit);

    res.status(200).json({
      page,
      limit,
      totalPosts: posts.length,
      totalPages: Math.ceil(posts.length / limit),
      posts: paginated,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Lấy bài viết từ người dùng đang theo dõi
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

// Lấy tất cả bài đăng (trừ bài của bản thân nếu đã đăng nhập)
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
const getSuggestedPosts = async (req, res) => {
  try {
    const { page, limit, lastSeenId } = getPaginationParams(req); // Pagination params
    const userId = req.user?._id;

    // Lọc bài viết từ những người mà user đã tương tác (like, repost) hoặc đang follow
    const followingIds = req.user?.following || []; // Các người dùng mà user đang theo dõi
    const interactedIds = [
      ...(req.user?.likes || []), // Bài viết mà người dùng đã like
      ...(req.user?.reposts || []), // Bài viết mà người dùng đã repost
    ];

    // Điều kiện truy vấn: lấy bài viết từ những người mà user theo dõi hoặc đã tương tác
    const query = {
      $or: [
        { postedBy: { $in: followingIds } }, // Bài viết từ người theo dõi
        { _id: { $in: interactedIds } }, // Bài viết người dùng đã like hoặc repost
        { status: "approved" }, // Lọc các bài viết đã được phê duyệt
      ],
    };

    // Tính điểm cho các bài viết (likes, reposts, followers, thời gian)
    const posts = await Post.find(query)
      .populate("postedBy", "_id username name profilePic followers") // Lấy thêm followers của người đăng
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian đăng
      .limit(limit) // Giới hạn số lượng bài viết trả về
      .skip(lastSeenId ? 1 : 0); // Nếu có lastSeenId, bỏ qua bài viết đã thấy

    // Tính điểm cho các bài viết
    posts.forEach((post) => {
      let score = 0;

      // Điểm cho likes
      score += post.likes.length * 0.1; // 0.1 điểm cho mỗi lượt thích

      // Điểm cho reposts
      score += post.repostedBy.length * 0.2; // 0.2 điểm cho mỗi lượt repost

      // Điểm cho followers của người đăng
      score += post.postedBy.followers.length * 0.05; // 0.05 điểm cho mỗi follower

      // Điểm cho thời gian đăng (bài viết mới hơn sẽ có điểm cao hơn)
      const timeFactor =
        (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24); // Số ngày kể từ khi bài viết được đăng
      score -= timeFactor * 0.1; // Cộng dồn điểm (bài viết mới được ưu tiên hơn)

      post.score = score; // Gán điểm cho bài viết

      // Cập nhật bài viết với điểm mới (nếu cần thiết)
      post.save();
    });

    // Sắp xếp bài viết theo điểm từ cao xuống thấp
    const sortedPosts = posts.sort((a, b) => b.score - a.score);

    // Trả về kết quả
    return res.status(200).json({
      page,
      limit,
      totalPosts: sortedPosts.length,
      posts: sortedPosts,
    });
  } catch (err) {
    console.error("Lỗi gợi ý bài viết:", err.message);
    return res.status(500).json({ error: "Lỗi server", message: err.message });
  }
};

// Lấy bài viết của 1 người dùng cụ thể theo username
const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const redisKey = `posts:${username}`;
    const { page, limit, skip } = getPaginationParams(req);

    const cached = await getRedis(redisKey); // đã là object

    if (cached) {
      const paginated = cached.slice(skip, skip + limit);
      return res.json({
        page,
        limit,
        totalPosts: cached.length,
        totalPages: Math.ceil(cached.length / limit),
        posts: paginated,
      });
    }

    const user = await User.findOne({ username }).select("_id");
    if (!user) return res.status(404).json({ error: "User not found" });

    const posts = await Post.find({ postedBy: user._id })
      .sort({ createdAt: -1 })
      .populate("postedBy", "_id username name profilePic");

    await setRedis(redisKey, posts, 1800); // cache 30 phút

    const paginated = posts.slice(skip, skip + limit);

    return res.status(200).json({
      page,
      limit,
      totalPosts: posts.length,
      totalPages: Math.ceil(posts.length / limit),
      posts: paginated,
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
        // Unrepost
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
        // Repost
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

        await session.commitTransaction(); // ✅ Chỉ commit rồi mới làm tiếp các việc sau
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    // ⚠️ Các thao tác sau khi transaction đã kết thúc
    const isFollowed = await isMutualOrOneWayFollow(userId, post.postedBy);
    if (isFollowed) {
      await sendNotification({
        sender: req.user,
        receivers: post.postedBy,
        type: "repost",
        content: `${req.user.username} just reposted your post.`,
        post: postId,
      });
    }

    await appendToCache(redisKey, post);
    return res.status(200).json({ message: "Post reposted successfully" });
  } catch (err) {
    console.error("Error in repost:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getTags = async (req, res) => {
  try {
    const userId = req.user._id;

    // Lấy danh sách tag mà user đã từng dùng (loại trùng, bỏ rỗng)
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

    // Lấy top 10 tags phổ biến toàn hệ thống (loại trùng, bỏ rỗng)
    const popularTags = await Post.aggregate([
      { $unwind: "$tags" },
      { $match: { tags: { $ne: "" } } }, // Bổ sung lọc rỗng ở đây
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Loại bỏ các tag trùng lặp giữa userTags và popularTags
    const uniquePopularTags = popularTags.filter(
      (tag) => !userTags.some((userTag) => userTag._id === tag._id)
    );

    // Sắp xếp tags của user lên đầu rồi đến gợi ý sắp xếp theo độ phổ biến
    const tags = [...userTags, ...uniquePopularTags];
    const tagNames = tags.map((tag) => tag._id);
    return res.status(200).json(tagNames);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return res.status(500).json({ error: "Server error" });
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
  getSuggestedPosts,
  getTags,
};
