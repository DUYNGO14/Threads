import User from "../models/userModel.js";
import Reply from "../models/replyModel.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

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
const searchUsers = async (req, res) => {
  try {
    const { query } = req.params;

    if (!query || query.trim() === "") {
      return res.status(400).json({ error: "Search query is required" });
    }

    const searchCondition = {
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    };

    const users = await User.find(searchCondition)
      .select("-password -updatedAt -email -followers -following") // tuỳ ý bỏ bớt các field không cần thiết
      .limit(10); // giới hạn kết quả

    if (!users.length) {
      return res.status(404).json({ error: "No users found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsersController:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// Cập nhật thông tin người dùng
const updateUser = async (req, res) => {
  try {
    const { name, username, bio, profilePic } = req.body;
    const userId = req.user._id;

    // Kiểm tra người dùng
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: "User not found" });

    // Không cho sửa thông tin của người khác
    if (req.params.id !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Bạn không được phép chỉnh sửa tài khoản này" });
    }

    // Cập nhật avatar nếu có
    if (profilePic) {
      user.profilePic = await uploadProfilePic(profilePic, user.profilePic);
    }

    // Cập nhật thông tin
    if (name) user.name = name;
    if (username) user.username = username;
    if (bio) user.bio = bio;

    // Lưu lại user
    await user.save();

    // Đồng bộ reply nếu có sửa username hoặc profilePic
    if (username || profilePic) {
      await Reply.updateMany(
        { userId },
        {
          $set: {
            ...(username && { username }),
            ...(profilePic && { userProfilePic: user.profilePic }),
          },
        }
      );
    }

    // Ẩn mật khẩu khi trả về
    user.password = null;

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in updateUser:", error);
    res.status(500).json({ error: "Lỗi server, vui lòng thử lại sau" });
  }
};
const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🔹 Lấy danh sách người đang theo dõi
    const user = await User.findById(userId).select("following");
    const following = user?.following || [];

    // 🔹 Lấy danh sách người dùng chưa được theo dõi
    const notFollowingUsers = await User.find({
      _id: { $ne: userId, $nin: following },
    })
      .sort({ createdAt: -1 }) // 🔹 Ưu tiên người mới
      .limit(4) // 🔹 Chỉ lấy tối đa 4 người
      .select("-password"); // Ẩn password

    res.status(200).json(notFollowingUsers);
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

const deleteAccount = async (req, res) => {
  try {
    const { password, isSocialLogin } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // For social login accounts, just delete without password verification
    if (isSocialLogin) {
      await User.findByIdAndDelete(req.user._id);
      return res.status(200).json({ success: true });
    }

    // For regular accounts, verify password
    if (!password) {
      return res
        .status(400)
        .json({ error: "Password is required for regular accounts" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // Delete user account
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in deleteAccount:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get current user's profile
const getCurrentUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -updatedAt"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getCurrentUserProfile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getListFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("followers");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getListFollowers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getListFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("following");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getListFollowing:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export {
  followUnFollowUser,
  updateUser,
  getUserProfile,
  getCurrentUserProfile,
  getSuggestedUsers,
  freezeAccount,
  deleteAccount,
  getListFollowers,
  getListFollowing,
  searchUsers,
};
