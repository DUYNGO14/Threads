import User from "../models/userModel.js";
import Reply from "../models/replyModel.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import detectAndFormatLinks from "../utils/helpers/detectAndFormatLinks.js";
import redis from "../config/redis.config.js";
import Post from "../models/postModel.js";
import { uploadProfilePic } from "../utils/uploadUtils.js";
import { sendNotification } from "../services/notificationService.js";
import Notification from "../models/notificationModel.js";
// Hàm upload ảnh đại diện

const followUnFollowUser = async (req, res) => {
  try {
    const { id } = req.params; // id của người bị follow / unfollow
    const userId = req.user._id; // id của người đang thực hiện hành động follow / unfollow

    // Kiểm tra xem id và userId có hợp lệ không
    if (!id || !userId) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
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
    // Chuyển sang ObjectId để so sánh chính xác
    const targetIdStr = id.toString(); // id phải là chuỗi
    const isFollowing = currentUser.following.some(
      (followedId) => followedId.toString() === targetIdStr
    );

    const updateCurrentUser = isFollowing
      ? { $pull: { following: userToModify._id } }
      : { $addToSet: { following: userToModify._id } }; // Dùng addToSet để tránh trùng

    const updateUserToModify = isFollowing
      ? { $pull: { followers: currentUser._id } }
      : { $addToSet: { followers: currentUser._id } };

    await Promise.all([
      User.findByIdAndUpdate(userId, updateCurrentUser),
      User.findByIdAndUpdate(id, updateUserToModify),
    ]);

    // Nếu là follow thì tạo thông báo + socket
    if (!isFollowing) {
      await sendNotification({
        sender: currentUser,
        receivers: id,
        type: "follow",
        content: "Started following you.",
      });
    } else {
      // Nếu unfollow thì đánh dấu thông báo không hợp lệ
      await Notification.findOneAndUpdate(
        { sender: userId, receiver: id, type: "follow" },
        { isValid: false }
      );
    }
    // await debounceFollow.saveAction(userId, id, now);
    await redis.del(`suggestions:${userId}`);

    return res.status(200).json({
      message: isFollowing
        ? "User unfollowed successfully"
        : "User followed successfully",
    });
  } catch (err) {
    console.error("❌ Error in followUnFollowUser:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const isMutualOrOneWayFollow = async (userAId, userBId) => {
  const userAObjectId =
    typeof userAId === "string" ? userAId : userAId.toString();
  const userB = await User.findById(userBId).select("followers following");

  if (!userB) return false;

  return (
    userB.followers.some((id) => id.toString() === userAObjectId) ||
    userB.following.some((id) => id.toString() === userAObjectId)
  );
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

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.isBlocked) {
      return res.status(404).json({ error: "This user is blocked" });
    }
    if (user.isFrozen) {
      return res.status(404).json({ error: "This user is frozen" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return res.status(500).json({ error: "Internal Server Error" });
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

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsersController:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
// Cập nhật thông tin người dùng
const updateUser = async (req, res) => {
  try {
    const { name, username, bio, profilePic, socialLinks } = req.body;
    const userId = req.user._id;
    if (!name || !username)
      return res.status(400).json({ error: "Name, username are required" });
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: "User not found" });

    if (req.params.id !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Bạn không được phép chỉnh sửa tài khoản này" });
    }

    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ error: "Username already exists" });
      }
      user.username = username;
    }

    if (profilePic) {
      user.profilePic = await uploadProfilePic(
        profilePic,
        user.profilePic,
        user.username
      );
    }

    if (name) user.name = name;
    if (bio) user.bio = bio;

    if (socialLinks && typeof socialLinks === "object") {
      const formattedLinks = {};
      for (const [platform, url] of Object.entries(socialLinks)) {
        if (url) {
          formattedLinks[platform] = detectAndFormatLinks(url);
        }
      }
      user.socialLinks = new Map(Object.entries(formattedLinks));
    }

    await user.save();

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

    user.password = null;

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in updateUser:", error);
    return res.status(500).json({ error: "Lỗi server, vui lòng thử lại sau" });
  }
};

const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user?._id.toString();
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    const cacheKey = `suggestions:${userId || "guest"}`;

    let cachedIds = await redis.get(cacheKey);
    if (cachedIds) {
      const paginatedIds = cachedIds.slice(start, end);
      const users = await User.find({
        _id: { $in: paginatedIds },
        role: "user",
      })
        .select("name username profilePic bio")
        .lean();
      return res.json(users);
    }

    let allSuggested = [];

    if (req.user) {
      const currentUser = await User.findById(userId).lean();
      if (!currentUser)
        return res.status(404).json({ message: "User not found" });

      const followingIds = currentUser.following.map(
        (id) => new mongoose.Types.ObjectId(id)
      );

      const mutuals = await User.aggregate([
        { $match: { _id: { $in: followingIds }, role: "user" } },
        { $unwind: "$following" },
        { $group: { _id: "$following", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 100 },
      ]);

      const mutualIds = mutuals
        .map((u) => u._id.toString())
        .filter(
          (id) =>
            id !== userId &&
            !currentUser.following.some((fid) => fid.toString() === id)
        );

      const yourPosts = await Post.find({ postedBy: userId })
        .select("likes")
        .lean();

      const likedBy = yourPosts.flatMap((p) =>
        p.likes.map((id) => id.toString())
      );

      const likeMap = likedBy.reduce((acc, id) => {
        if (
          id !== userId &&
          !currentUser.following.some((fid) => fid.toString() === id)
        ) {
          acc[id] = (acc[id] || 0) + 1;
        }
        return acc;
      }, {});

      const likeIds = Object.entries(likeMap)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);

      allSuggested = [...new Set([...mutualIds, ...likeIds])];

      if (allSuggested.length < 100) {
        const excludeIds = [
          ...currentUser.following.map((id) => id.toString()),
          userId,
          ...allSuggested,
        ];

        const topUsers = await User.aggregate([
          {
            $match: {
              _id: {
                $nin: excludeIds.map((id) => new mongoose.Types.ObjectId(id)),
              },
              role: "user",
            },
          },
          {
            $addFields: {
              followersCount: { $size: { $ifNull: ["$followers", []] } },
            },
          },
          { $sort: { followersCount: -1 } },
          { $limit: 100 - allSuggested.length },
        ]);

        const topUserIds = topUsers.map((u) => u._id.toString());
        allSuggested.push(...topUserIds);
      }
    } else {
      const topUsers = await User.aggregate([
        {
          $addFields: {
            followersCount: { $size: { $ifNull: ["$followers", []] } },
          },
        },
        { $match: { role: "user" } },
        { $sort: { followersCount: -1 } },
        { $limit: 100 },
      ]);

      allSuggested = topUsers.map((u) => u._id.toString());
    }

    await redis.set(cacheKey, JSON.stringify(allSuggested), { ex: 900 });

    const paginatedIds = allSuggested.slice(start, end);
    const users = await User.find({ _id: { $in: paginatedIds }, role: "user" })
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

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in freezeAccount:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
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

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in deleteAccount:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get current user's profile
const getCurrentUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -updatedAt"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in getCurrentUserProfile:", error);
    return res.status(500).json({ error: "Internal Server Error" });
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

    return res.status(200).json(followers);
  } catch (error) {
    console.error("Error in getListFollowers:", error);
    return res.status(500).json({ error: "Internal Server Error" });
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

    return res.status(200).json(following);
  } catch (error) {
    console.error("Error in getListFollowing:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const searchSuggestedUsers = async (req, res) => {
  try {
    const query = req.query.q;
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

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsersController:", error);
    return res.status(500).json({ error: "Internal Server Error" });
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
  isMutualOrOneWayFollow,
};
