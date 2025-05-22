import { formatResponse } from "../utils/formatResponse.js";
import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import getPaginationParams from "../utils/helpers/getPaginationParams.js";
import dayjs from "dayjs";
import Report from "../models/reportModel.js";
import { addNotificationJob } from "../queues/notification.producer.js";
export const getRegisteredUsersByWeek = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || dayjs().month() + 1;
    const year = parseInt(req.query.year) || dayjs().year();
    const matchConditions = [];
    if (!isNaN(month)) {
      matchConditions.push({ $eq: [{ $month: "$createdAt" }, month] });
    }
    if (!isNaN(year)) {
      matchConditions.push({ $eq: [{ $year: "$createdAt" }, year] });
    }

    const agg = [
      ...(matchConditions.length
        ? [
            {
              $match: {
                $expr: {
                  $and: matchConditions,
                },
              },
            },
          ]
        : []),
      {
        $project: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          week: { $week: "$createdAt" },
        },
      },
      {
        $group: {
          _id: {
            year: "$year",
            month: "$month",
            week: "$week",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 },
      },
    ];

    const registeredUsersByWeek = await User.aggregate(agg);
    return res
      .status(200)
      .json(
        formatResponse(
          200,
          "Get registered users by week successfully",
          registeredUsersByWeek
        )
      );
  } catch (error) {
    return res.status(500).json(formatResponse(500, error.message));
  }
};
export const getReportStatisticsByMonthOrYear = async (req, res) => {
  try {
    // const month = parseInt(req.query.month) || dayjs().month() + 1;
    // const year = parseInt(req.query.year) || dayjs().year();
    const month = parseInt(req.query.month);
    const year = parseInt(req.query.year);
    const matchStage = {};
    if (month) {
      matchStage["$expr"] = { $eq: [{ $month: "$createdAt" }, Number(month)] };
    }
    if (year) {
      matchStage["$expr"] = {
        $and: [
          ...(matchStage["$expr"] ? [matchStage["$expr"]] : []),
          { $eq: [{ $year: "$createdAt" }, Number(year)] },
        ],
      };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            week: { $isoWeek: "$createdAt" },
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          postCount: {
            $sum: { $cond: [{ $eq: ["$type", "post"] }, 1, 0] },
          },
          commentCount: {
            $sum: { $cond: [{ $eq: ["$type", "comment"] }, 1, 0] },
          },
          userCount: {
            $sum: { $cond: [{ $eq: ["$type", "user"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } },
    ];

    const stats = await Report.aggregate(pipeline);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const getPostsByWeek = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || dayjs().month() + 1;
    const year = parseInt(req.query.year) || dayjs().year();

    const matchConditions = [];
    if (!isNaN(month)) {
      matchConditions.push({ $eq: [{ $month: "$createdAt" }, month] });
    }
    if (!isNaN(year)) {
      matchConditions.push({ $eq: [{ $year: "$createdAt" }, year] });
    }

    const agg = [
      ...(matchConditions.length
        ? [
            {
              $match: {
                $expr: {
                  $and: matchConditions,
                },
              },
            },
          ]
        : []),
      {
        $project: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          week: { $week: "$createdAt" },
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month", week: "$week" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 },
      },
    ];

    const postsByWeek = await Post.aggregate(agg);
    return res
      .status(200)
      .json(formatResponse(200, "Get posts by week successfully", postsByWeek));
  } catch (error) {
    return res.status(500).json(formatResponse(500, error.message));
  }
};

export const getPostByStatus = async (req, res) => {
  try {
    const agg = [
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];
    const postByStatus = await Post.aggregate(agg);

    // Danh sách đầy đủ trạng thái mặc định
    const defaultStatuses = [
      "pending",
      "approved",
      "rejected",
      "pending_review",
    ];

    // Map kết quả từ DB ra dạng object để dễ xử lý
    const resultMap = {};
    postByStatus.forEach((item) => {
      resultMap[item._id] = item.count;
    });

    // Tạo mảng đầy đủ 4 trạng thái, nếu không có thì count = 0
    const finalResult = defaultStatuses.map((status) => ({
      _id: status,
      count: resultMap[status] || 0,
    }));

    return res
      .status(200)
      .json(
        formatResponse(200, "Get post by status successfully", finalResult)
      );
  } catch (error) {
    return res.status(500).json(formatResponse(500, error.message));
  }
};
export const getGrowthStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Tổng Users
    const thisMonthUsers = await User.countDocuments({
      createdAt: { $gte: startOfThisMonth },
    });

    const lastMonthUsers = await User.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
    });

    // Tổng Posts
    const thisMonthPosts = await Post.countDocuments({
      createdAt: { $gte: startOfThisMonth },
    });

    const lastMonthPosts = await Post.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
    });

    // Tổng Reports (giả sử là posts có status === "pending")
    const thisMonthReports = await Post.countDocuments({
      status: "pending",
      createdAt: { $gte: startOfThisMonth },
    });

    const lastMonthReports = await Post.countDocuments({
      status: "pending",
      createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
    });

    // Hàm tính phần trăm thay đổi
    const calculateChange = (current, previous) => {
      if (previous === 0 && current === 0) return 0;
      if (previous === 0) return 100; // Nếu tháng trước là 0, coi như tăng 100%
      return ((current - previous) / previous) * 100;
    };

    const data = [
      {
        _id: "users",
        count: await User.countDocuments(),
        percentChange: calculateChange(thisMonthUsers, lastMonthUsers),
      },
      {
        _id: "posts",
        count: await Post.countDocuments(),
        percentChange: calculateChange(thisMonthPosts, lastMonthPosts),
      },
      {
        _id: "reports",
        count: await Post.countDocuments({ status: "pending" }),
        percentChange: calculateChange(thisMonthReports, lastMonthReports),
      },
    ];

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error getting growth stats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export const getAllUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const [users, totalUsers] = await Promise.all([
      User.find({ role: { $ne: "admin" } })
        .select("-password")
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    return res.status(200).json(
      formatResponse(200, "Get all users successfully", {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        users,
      })
    );
  } catch (error) {
    return res.status(500).json(formatResponse(500, error.message));
  }
};

export const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(formatResponse(404, "User not found"));
    }
    const isBlocked = user.isBlocked;
    const message = isBlocked
      ? "Unblock user successfully"
      : "Block user successfully";
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isBlocked: !isBlocked },
      { new: true }
    );
    return res.status(200).json(formatResponse(200, message, updatedUser));
  } catch (error) {
    return res.status(500).json(formatResponse(500, error.message));
  }
};

export const updatePostStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const { status } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      { status },
      { new: true }
    );
    if (!post) {
      return res.status(404).json(formatResponse(404, "Post not found"));
    }
    if (status === "rejected" || status === "approved") {
      await addNotificationJob({
        sender: req.user._id,
        receivers: post.postedBy,
        type: "post",
        content:
          status === "rejected"
            ? "Your post has been rejected"
            : "Your post has been approved",
        post: post._id,
      });
    }
    return res
      .status(200)
      .json(formatResponse(200, "Update post status successfully", post));
  } catch (error) {
    return res.status(500).json(formatResponse(500, error.message));
  }
};

export const getPostsByStatus = async (req, res) => {
  try {
    // Lấy trạng thái từ query và kiểm tra tính hợp lệ
    const status = req.query.status || ""; // Nếu không truyền status, sẽ là ""
    const validStatuses = ["pending", "approved", "rejected", "pending_review"];

    // Kiểm tra tính hợp lệ của status nếu có
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // Lấy tham số phân trang
    const { page, limit, skip } = getPaginationParams(req);

    // Truy vấn các bài viết với trạng thái hợp lệ hoặc tất cả nếu không có status
    const query = status ? { status } : {}; // Nếu có status thì tìm theo status, nếu không thì lấy tất cả

    // Tối ưu việc truy vấn bài viết và đếm tổng số bài viết với `lean()`
    const [posts, totalPosts] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo
        .skip(skip) // Dùng skip để phân trang
        .limit(limit) // Dùng limit để giới hạn số bài viết trả về
        .populate("postedBy", "_id username name profilePic") // Populate người đăng bài
        .lean(), // Tối ưu bằng cách sử dụng lean() để chỉ lấy dữ liệu thuần
      Post.countDocuments(query), // Đếm tổng số bài viết theo query
    ]);

    // Trả về kết quả
    return res.status(200).json(
      formatResponse(200, "Get posts successfully", {
        page,
        limit,
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        posts,
      })
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
