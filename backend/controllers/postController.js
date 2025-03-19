import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

const MAX_FILES = 5;

const createPost = async (req, res) => {
  try {
    const { postedBy, text } = req.body;
    const user = await User.findById(postedBy);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: "Unauthorized to create post" });
    }

    if (text.length > 500) {
      return res
        .status(400)
        .json({ error: "Text must be less than 500 characters" });
    }

    let mediaFiles = [];

    // 🟢 Upload nhiều ảnh hoặc video song song lên Cloudinary
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        try {
          const resourceType = file.mimetype.startsWith("video")
            ? "video"
            : "image";

          // Upload lên Cloudinary
          const uploadedResponse = await cloudinary.uploader.upload(file.path, {
            resource_type: resourceType,
          });

          // Xóa file tạm sau khi upload thành công
          await fs.unlink(file.path);

          return { url: uploadedResponse.secure_url, type: resourceType };
        } catch (err) {
          console.error("Lỗi upload:", err);
          return null;
        }
      });

      // Đợi tất cả file được upload xong
      mediaFiles = (await Promise.all(uploadPromises)).filter(
        (file) => file !== null
      );
    }

    const newPost = new Post({ postedBy, text, media: mediaFiles });
    await newPost.save();

    res.status(201).json(newPost);
  } catch (err) {
    console.error("Lỗi tạo bài viết:", err.message);
    res.status(500).json({ error: err.message });
  }
};

const getPost = async (req, res) => {
  try {
    const id = req.params.id;
    const post = await Post.findById(id);
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
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: "Unauthorized to delete post" });
    }

    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      .limit(limit);

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = {}; // Mặc định lấy tất cả bài viết

    // 🟢 Kiểm tra nếu user đăng nhập, loại bỏ bài viết của chính họ
    if (req.user && req.user._id) {
      filter.postedBy = { $ne: req.user._id };
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments(filter);

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

    const posts = await Post.find({ postedBy: user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
};
