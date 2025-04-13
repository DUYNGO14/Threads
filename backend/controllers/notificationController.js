import Notification from "../models/Notification.js";
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "username profilePic")
      .populate("postId", "content")
      .populate("replyId", "text")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Error fetching notifications" });
  }
};
