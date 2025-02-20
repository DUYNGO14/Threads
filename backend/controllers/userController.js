import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

// Hàm hash mật khẩu
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Hàm upload ảnh đại diện
const uploadProfilePic = async (newPic, oldPic) => {
  if (oldPic) {
    await cloudinary.uploader.destroy(oldPic.split("/").pop().split(".")[0]);
  }
  const uploadedResponse = await cloudinary.uploader.upload(newPic);
  return uploadedResponse.secure_url;
};
const uploadVideo = async (newVideo, oldVideo) => {
  if (oldVideo) {
    await cloudinary.uploader.destroy(oldVideo.split("/").pop().split(".")[0], {
      resource_type: "video",
    });
  }

  const uploadedResponse = await cloudinary.uploader.upload(newVideo, {
    resource_type: "video",
    folder: "videos", // Thư mục lưu video trong Cloudinary
    chunk_size: 6000000, // Upload theo từng phần 6MB (hữu ích cho video lớn)
  });

  return uploadedResponse.secure_url;
};

//signup
const signupUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Kiểm tra xem username hoặc email đã tồn tại chưa
    const isUserExist = await User.exists({ $or: [{ username }, { email }] });
    if (isUserExist)
      return res.status(400).json({ error: "User already exists" });

    // Băm mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    // Tạo token và gửi cookie
    generateTokenAndSetCookie(newUser._id, res);

    // Trả về thông tin user (loại bỏ mật khẩu)
    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
    });
  } catch (error) {
    console.error("Error in signupUser:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//login
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Tìm user theo username và lấy mật khẩu
    const user = await User.findOne({ username }).select("+password").lean();
    if (!user)
      return res.status(400).json({ error: "Invalid username or password" });

    // Kiểm tra mật khẩu
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch)
      return res.status(400).json({ error: "Invalid username or password" });
    // Tạo token và gửi cookie
    generateTokenAndSetCookie(user._id, res);
    await User.findByIdAndUpdate(user._id, { isFrozen: false });
    res.status(200).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
    });
  } catch (error) {
    console.error("Error in loginUser:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.clearCookie("jwt");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logoutUser:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const followUnFollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (id === userId.toString()) {
      return res
        .status(400)
        .json({ error: "You cannot follow/unfollow yourself" });
    }

    const [userToModify, currentUser] = await Promise.all([
      User.findById(id),
      User.findById(userId),
    ]);

    if (!userToModify || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const isFollowing = currentUser.following.includes(id);

    const updateCurrentUser = isFollowing
      ? { $pull: { following: id } }
      : { $push: { following: id } };

    const updateUserToModify = isFollowing
      ? { $pull: { followers: userId } }
      : { $push: { followers: userId } };

    await Promise.all([
      User.findByIdAndUpdate(userId, updateCurrentUser),
      User.findByIdAndUpdate(id, updateUserToModify),
    ]);

    res.status(200).json({
      message: isFollowing
        ? "User unfollowed successfully"
        : "User followed successfully",
    });
  } catch (err) {
    console.error("Error in followUnFollowUser:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { query } = req.params;

    const user = await User.findOne(
      mongoose.Types.ObjectId.isValid(query)
        ? { _id: query }
        : { username: query }
    ).select("-password -updatedAt"); // giúp bỏ qua password và updatedAt, không trả về trong kết quả.

    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Cập nhật thông tin người dùng
const updateUser = async (req, res) => {
  try {
    const { name, email, username, password, bio, profilePic } = req.body;
    const userId = req.user._id;

    let user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: "User not found" });

    if (req.params.id !== userId.toString()) {
      return res
        .status(400)
        .json({ error: "You cannot update another user's profile" });
    }

    if (password) user.password = await hashPassword(password);
    if (profilePic)
      user.profilePic = await uploadProfilePic(profilePic, user.profilePic);

    Object.assign(user, { name, email, username, bio });

    await user.save();

    // Cập nhật username & profilePic trong các bài post mà user đã reply
    await Post.updateMany(
      { "replies.userId": userId },
      {
        $set: {
          "replies.$[reply].username": user.username,
          "replies.$[reply].userProfilePic": user.profilePic,
        },
      },
      { arrayFilters: [{ "reply.userId": userId }] }
    );

    user.password = null;
    res.status(200).json(user);
  } catch (error) {
    console.error("Error in updateUser:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    // Lấy danh sách những người dùng mà user hiện tại đang theo dõi
    const { following } = await User.findById(userId).select("following");

    // Lọc danh sách gợi ý, loại trừ chính user hiện tại và những người đã theo dõi
    const suggestedUsers = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId, $nin: following },
        },
      },
      { $sample: { size: 4 } }, // Lấy ngẫu nhiên 4 người dùng
      { $project: { password: 0 } }, // Ẩn mật khẩu
    ]);

    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.error("Error in getSuggestedUsers:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const freezeAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isFrozen: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in freezeAccount:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  signupUser,
  loginUser,
  logoutUser,
  followUnFollowUser,
  updateUser,
  getUserProfile,
  getSuggestedUsers,
  freezeAccount,
};
