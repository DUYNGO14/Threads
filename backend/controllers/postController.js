import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { uploadFiles } from "../utils/uploadUtils.js";
import { MAX_FILES, MAX_CHAR } from "../constants/upload.js";
import { cleanCommentText, moderateText } from "../utils/moderateText.js";
import Reply from "../models/replyModel.js";
import { LIMIT_PAGINATION_REPLY } from "../constants/pagination.js";
import getPaginationParams from "../utils/helpers/getPaginationParams.js";
import {
  setRedis,
  getRedis,
  removePostFromCache,
  appendToCache,
  deleteRedis,
} from "../utils/redisCache.js";
const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (err) {
    console.error("Error deleting media from Cloudinary:", err);
    throw new Error("Failed to delete media from Cloudinary");
  }
};

const createPost = async (req, res) => {
  try {
    const { postedBy, text } = req.body;
    const user = await User.findById(postedBy);
    if (!user) return res.status(404).json({ error: "User not found" });
    const redisKey = `posts:${user.username}`;
    if (text.length > MAX_CHAR) {
      return res.status(400).json({
        error: `Text must be less than ${MAX_CHAR} characters`,
      });
    }

    const { ok, message, cleanedText } = moderateText(text);
    if (!ok) {
      return res.status(400).json({ error: message });
    }

    let mediaFiles = [];
    if (req.files?.length > 0) {
      if (req.files.length > MAX_FILES) {
        return res.status(400).json({
          error: `You can only upload up to ${MAX_FILES} files`,
        });
      }

      mediaFiles = await uploadFiles(req.files);

      if (mediaFiles.length === 0) {
        return res.status(400).json({ error: "All media uploads failed" });
      }
    }
    console.log("tags", tags);
    const newPost = new Post({
      postedBy,
      text: cleanedText,
      media: mediaFiles,
      status: "approved",
      tags: tags,
    });

    await newPost.save();
    // await deleteRedis(redisKey);
    const populatedPost = await Post.findById(newPost._id).populate(
      "postedBy",
      "_id username name profilePic"
    );
    await appendToCache(redisKey, populatedPost);
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("Post creation error:", err.message);
    res.status(500).json({ error: "Something went wrong. Try again." });
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
    res.status(200).json(post);
  } catch (err) {
    console.error("Error in updatePost:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
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
    res.status(200).json({
      post: { ...post, replies: undefined }, // loại bỏ replies trong post gốc
      replies,
      totalReplies: totalRepliesCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalRepliesCount / limit),
    });
  } catch (error) {
    console.error("Error in getPost:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
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
      console.log("deletePost", keyRedis);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (post.postedBy._id.toString() !== req.user._id.toString()) {
        return res.status(401).json({ error: "Unauthorized to delete post" });
      }

      // Xóa tất cả media files trên Cloudinary
      if (post.media && post.media.length > 0) {
        const deletePromises = post.media.map(async (media) => {
          const publicId = media.url.split("/").pop().split(".")[0];
          try {
            await cloudinary.uploader.destroy(publicId, {
              resource_type: media.type === "video" ? "video" : "image",
            });
          } catch (error) {
            console.error("Error deleting media from Cloudinary:", error);
          }
        });
        await Promise.all(deletePromises);
      }

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
      res.status(200).json({
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
    console.error("Error in deletePost:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const likeUnlikePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      // Unlike post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      res.status(200).json({ message: "Post unliked successfully" });
    } else {
      // Like post
      post.likes.push(userId);
      await post.save();
      res.status(200).json({ message: "Post liked successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const replyToPost = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: postId } = req.params;
    const { _id: userId, profilePic: userProfilePic, username } = req.user;
    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }

    // Cập nhật lại post để thêm reference tới reply (nếu cần thiết)
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Tiến hành làm sạch text nếu có
    const cleanReply = await moderateText(text);
    if (!cleanReply.ok) {
      return res.status(400).json({ error: cleanReply.message });
    }

    // Tạo một document mới cho Reply
    const newReply = new Reply({
      userId,
      text: cleanReply.cleanedText,
      originalText: text,
      userProfilePic,
      username,
      postId,
    });

    // Lưu reply vào collection Reply
    await newReply.save();

    // Cập nhật trường replies trong Post (chỉ lưu reference đến reply)
    post.replies.push(newReply._id);
    await post.save();

    res
      .status(200)
      .json({ success: true, message: "Reply added successfully" });
  } catch (err) {
    console.error("Error in replyToPost:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Lấy reposts của user
const getReposts = async (req, res) => {
  try {
    const { username } = req.params;
    const redisKey = `reposted:${username}`;
    console.log(`\n[Redis Log] Key: ${redisKey}`);
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
    console.log(user);
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
    console.error("getRepostedPosts error", error);
    res.status(500).json({ error: error.message });
  }
};

// Lấy bài viết từ người dùng đang theo dõi
const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { page, limit, skip } = getPaginationParams(req);

    const query = {
      postedBy: { $in: user.following, $ne: userId },
    };

    const [posts, totalPosts] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("postedBy", "_id username name profilePic"),

      Post.countDocuments(query),
    ]);

    res.status(200).json({
      page,
      limit,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      posts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy tất cả bài đăng (trừ bài của bản thân nếu đã đăng nhập)
const getAllPosts = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);

    const query = req.user?._id ? { postedBy: { $ne: req.user._id } } : {};

    const [posts, totalPosts] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("postedBy", "_id username name profilePic"),

      Post.countDocuments(query),
    ]);

    res.status(200).json({
      page,
      limit,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      posts,
    });
  } catch (err) {
    console.error("Lỗi lấy bài viết:", err.message);
    res.status(500).json({ error: "Lỗi server", message: err.message });
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

    res.status(200).json({
      page,
      limit,
      totalPosts: posts.length,
      totalPages: Math.ceil(posts.length / limit),
      posts: paginated,
    });
  } catch (error) {
    console.error("getUserPosts error", error);
    res.status(500).json({ error: error.message });
  }
};

const repost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    // Kiểm tra xem bài viết có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Bắt đầu transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const hasReposted = post.repostedBy.includes(userId);

      if (hasReposted) {
        // Nếu đã repost thì xóa (unrepost)
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
        res.status(200).json({ message: "Post unreposted successfully" });
      } else {
        // Nếu chưa repost thì thêm mới
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
        res.status(200).json({ message: "Post reposted successfully" });
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error("Error in repost:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  createPost,
  getPost,
  deletePost,
  likeUnlikePost,
  replyToPost,
  getFeedPosts,
  getUserPosts,
  getReposts,
  getAllPosts,
  updatePost,
  repost,
};
