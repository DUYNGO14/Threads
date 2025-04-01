import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { uploadFiles } from "../utils/uploadUtils.js";
import { MAX_FILES, MAX_CHAR } from "../constants/upload.js";


const createPost = async (req, res) => {
  try {
    const { postedBy, text } = req.body;
    const user = await User.findById(postedBy);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (text.length > MAX_CHAR) {
      return res
        .status(400)
        .json({ error: `Text must be less than ${MAX_CHAR} characters` });
    }

    let mediaFiles = [];
    if (req.files && req.files.length > 0) {
      if (req.files.length > MAX_FILES) {
        return res
          .status(400)
          .json({ error: `You can only upload up to ${MAX_FILES} files` });
      }
      mediaFiles = await uploadFiles(req.files);
    }

    // Create new post
    const newPost = new Post({ postedBy, text, media: mediaFiles });
    await newPost.save();

    // Populate to return full information
    const populatedPost = await Post.findById(newPost._id).populate(
      "postedBy",
      "_id username name profilePic"
    );
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("Post error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const id = req.params.id;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: "Unauthorized to update post" });
    }

    if (req.body.text) {
      post.text = req.body.text;
    }

    if (req.files && req.files.length > 0) {
      const mediaFiles = await uploadFiles(req.files);
      post.media = post.media.concat(mediaFiles);
    }

    await post.save();

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log("Error in updatePost: ", error.message);
  }
};

const getPost = async (req, res) => {
  try {
    const id = req.params.id;
    const post = await Post.findById(id).populate(
      "postedBy",
      "_id username name profilePic"
    );
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log("Error in getPosts: ", error.message);
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
    const { _id: userId, profilePic: userProfilePic, username } = req.user; //lấy từ middleware xác thực

    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }

    const post = await Post.findByIdAndUpdate(
      postId,
      { $push: { replies: { userId, text, userProfilePic, username } } },
      { new: true, runValidators: true }
    );

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Reply added successfully" });
  } catch (err) {
    console.error("Error in replyToPost:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Lấy danh sách bài đăng
const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user._id; // ID của user hiện tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const following = user.following;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      postedBy: { $in: following, $ne: userId },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("postedBy", "_id username name profilePic");

    // Tổng số bài viết (chỉ tính bài từ người khác)
    const totalPosts = await Post.countDocuments({
      postedBy: { $in: following, $ne: userId },
    });

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

const getAllPosts = async (req, res) => {
  try {
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;

    if (limit > 50) limit = 50; // Giới hạn max tránh tải quá nhiều dữ liệu
    const skip = (page - 1) * limit;
    let query = {};

    // Nếu có user đăng nhập, loại trừ bài viết của họ
    if (req.user && req.user._id) {
      query.postedBy = { $ne: req.user._id };
    }

    // Lấy tất cả bài viết
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("postedBy", "_id username name profilePic");

    // Đếm tổng số bài viết theo query
    const totalPosts = await Post.countDocuments(query);

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

const getUserPosts = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await Post.find({ postedBy: user._id })
      .sort({
        createdAt: -1,
      })
      .populate("postedBy", "_id username name profilePic");

    res.status(200).json(posts);
  } catch (error) {
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
  getAllPosts,
  updatePost,
  repost,
};
