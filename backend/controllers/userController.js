import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcryptjs";
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

    let searchCondition;

    if (mongoose.Types.ObjectId.isValid(query)) {
      searchCondition = { _id: query };
    } else {
      searchCondition = { username: { $regex: query, $options: "i" } }; // 🔥 Tìm username gần đúng, không phân biệt hoa thường
    }

    const user = await User.findOne(searchCondition).select(
      "-password -updatedAt"
    );

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

    const { following } = await User.findById(userId).select("following");

    const suggestedUsers = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId, $nin: following },
        },
      },
      { $sample: { size: 4 } },
      { $project: { password: 0 } },
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
  followUnFollowUser,
  updateUser,
  getUserProfile,
  getSuggestedUsers,
  freezeAccount,
};
