import Report from "../models/reportModel.js";
import { formatResponse } from "../utils/formatResponse.js";

export const createReport = async (req, res) => {
  try {
    const { postId, commentId, userId, reason, type } = req.body;
    const reportedBy = req.user._id;

    if (!postId && !commentId && !userId) {
      return res.status(400).json({
        message: "Missing report target (postId, commentId, or userId)",
      });
    }
    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const existingReport = await Report.findOne({
      reportedBy,
      ...(postId && { postId }),
      ...(commentId && { commentId }),
      ...(userId && { userId }),
    });

    if (existingReport) {
      return res
        .status(400)
        .json({ message: "You have already reported this item" });
    }

    const newReport = new Report({
      reportedBy,
      postId: postId || null,
      commentId: commentId || null,
      userId: userId || null,
      reason,
      type,
    });

    await newReport.save();

    return res
      .status(201)
      .json({ message: "Report submitted successfully", report: newReport });
  } catch (error) {
    console.error("Error creating report:", error);
    return res.status(500).json({ message: "Failed to create report" });
  }
};
export const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate({
        path: "reportedBy",
        select: "username email profilePic",
      })
      .populate({
        path: "postId",
        select: "text postedBy",
        populate: {
          path: "postedBy",
          select: "username email profilePic",
        },
      })
      .populate({
        path: "userId",
        select: "username email profilePic",
      })
      .populate({
        path: "commentId",
        select: "text userId",
        populate: {
          path: "userId",
          select: "username email profilePic",
        },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Report.countDocuments(filter);

    return res.status(200).json({
      data: reports,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching reports:", error.message);
    return res.status(500).json({ message: "Failed to fetch reports" });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!["pending", "reviewed", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      { status },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.status(200).json({ message: "Report status updated", report });
  } catch (error) {
    console.error("Error updating report status:", error);
    return res.status(500).json({ message: "Failed to update report status" });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findByIdAndDelete(reportId);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    return res.status(500).json({ message: "Failed to delete report" });
  }
};

export const getReportStats = async (req, res) => {
  try {
    const stats = await Report.aggregate([
      {
        $group: {
          _id: { status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({ stats });
  } catch (error) {
    console.error("Error getting report stats:", error);
    return res.status(500).json({ message: "Failed to get report stats" });
  }
};

export const getReportsDetails = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId).populate(
      "reportedBy",
      "username email"
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    let target = null;
    let targetType = "";

    if (report.postId) {
      target = await Post.findById(report.postId)
        .populate("postedBy", "username email")
        .populate("taggedFriends", "username email");
      targetType = "post";
    } else if (report.userId) {
      target = await User.findById(report.userId).select(
        "username email profilePic"
      );
      targetType = "user";
    } else if (report.commentId) {
      target = await Reply.findById(report.commentId).populate(
        "userId",
        "username email"
      );
      targetType = "comment";
    }

    return res.status(200).json({
      report,
      targetType,
      target,
    });
  } catch (error) {
    console.error("Error getting report details:", error);
    return res.status(500).json({ message: "Failed to get report details" });
  }
};
