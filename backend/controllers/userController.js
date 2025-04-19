import User from "../models/userModel.js";
import Reply from "../models/replyModel.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import detectAndFormatLinks from "../utils/helpers/detectAndFormatLinks.js";
import redis from "../config/redis.config.js";
import { LIMIT_PAGINATION_SUGGESTION } from "../constants/pagination.js";
import Post from "../models/postModel.js";
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
    await Promise.all([redis.del(`suggestions:${userId}`)]);
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
    const { name, username, bio, profilePic, socialLinks } = req.body;
    const userId = req.user._id;
    console.log(req.body);
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

    // Cập nhật thông tin người dùng
    if (name) user.name = name;
    if (username) user.username = username;
    if (bio) user.bio = bio;

    // Cập nhật các liên kết mạng xã hội nếu có
    if (socialLinks && typeof socialLinks === "object") {
      // Duyệt qua các liên kết và chuyển chúng thành thẻ <a> có thể nhấp vào
      const formattedLinks = {};
      for (const [platform, url] of Object.entries(socialLinks)) {
        if (url) {
          formattedLinks[platform] = detectAndFormatLinks(url);
        }
      }

      // Cập nhật socialLinks
      user.socialLinks = new Map(Object.entries(formattedLinks));
    }

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
    const userId = req.user._id.toString();
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    const cacheKey = `suggestions:${userId}`;

    // 1. Lấy danh sách gợi ý từ cache Redis
    let cachedIds = await redis.get(cacheKey);

    if (cachedIds) {
      const paginatedIds = cachedIds.slice(start, end);
      const users = await User.find({ _id: { $in: paginatedIds } })
        .select("name username profilePic bio")
        .lean();
      return res.json(users);
    }

    // 2. Nếu chưa có cache → tạo danh sách gợi ý mới
    const currentUser = await User.findById(userId).lean();
    if (!currentUser)
      return res.status(404).json({ message: "User not found" });

    const followingIds = currentUser.following.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // 2.1 Gợi ý theo mutual following
    const mutuals = await User.aggregate([
      { $match: { _id: { $in: followingIds } } },
      { $unwind: "$following" },
      { $group: { _id: "$following", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ]);

    const mutualIds = mutuals
      .map((u) => u._id.toString())
      .filter((id) => id !== userId && !currentUser.following.includes(id));

    // 2.2 Gợi ý theo người hay like bài viết
    const yourPosts = await Post.find({ postedBy: userId })
      .select("likes")
      .lean();
    const likedBy = yourPosts.flatMap((p) =>
      p.likes.map((id) => id.toString())
    );

    const likeMap = likedBy.reduce((acc, id) => {
      if (id !== userId && !currentUser.following.includes(id)) {
        acc[id] = (acc[id] || 0) + 1;
      }
      return acc;
    }, {});

    const likeIds = Object.entries(likeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    // 2.3 Gộp lại danh sách
    const allSuggested = [...new Set([...mutualIds, ...likeIds])];

    // 2.4 Nếu chưa đủ thì thêm người nổi bật (nhiều follower)
    if (allSuggested.length < 100) {
      const exclude = [...currentUser.following, userId, ...allSuggested];
      const topUsers = await User.aggregate([
        {
          $match: {
            _id: { $nin: exclude.map((id) => new mongoose.Types.ObjectId(id)) },
          },
        },
        { $project: { followersCount: { $size: "$followers" } } },
        { $sort: { followersCount: -1 } },
        { $limit: 100 - allSuggested.length },
      ]);
      const topUserIds = topUsers.map((u) => u._id.toString());
      allSuggested.push(...topUserIds);
    }

    // 3. Lưu danh sách ID vào cache Redis
    await redis.set(cacheKey, JSON.stringify(allSuggested), { ex: 900 }); // 15 phút

    // 4. Trả về trang đầu tiên
    const paginatedIds = allSuggested.slice(start, end);
    const users = await User.find({ _id: { $in: paginatedIds } })
      .select("name username profilePic bio")
      .lean();

    return res.json(users);
  } catch (err) {
    console.error("Error in getSuggestedUsers:", err);
    return res.status(500).json({ message: "Lỗi khi lấy gợi ý người dùng" });
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
    const user = await User.findOne({ username: req.params.username }).select(
      "followers"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    const followers = await User.find({ _id: { $in: user.followers } }).select(
      "_id username name profilePic followers following"
    );

    res.status(200).json(followers);
  } catch (error) {
    console.error("Error in getListFollowers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getListFollowing = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select(
      "following"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    const following = await User.find({ _id: { $in: user.following } }).select(
      "_id username name profilePic followers following"
    );

    res.status(200).json(following);
  } catch (error) {
    console.error("Error in getListFollowing:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const searchSuggestedUsers = async (req, res) => {
  try {
    const query = req.query.q;
    console.log(query);
    if (!query || query.trim() === "") {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Điều kiện tìm kiếm cơ bản
    const searchCondition = {
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    };

    // Nếu đã đăng nhập => lọc bỏ người đã follow và chính mình
    if (req.user) {
      const currentUser = await User.findById(req.user._id).select("following");
      const excludedUserIds = [
        ...currentUser.following,
        req.user._id.toString(),
      ];
      searchCondition._id = { $nin: excludedUserIds };
    }

    const users = await User.find(searchCondition)
      .select("username name profilePic bio")
      .limit(10);

    if (!users.length) {
      return res.status(404).json({ error: "No users found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsersController:", error);
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
  searchSuggestedUsers,
};
