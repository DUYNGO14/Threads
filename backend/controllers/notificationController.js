import Notification from "../models/notificationModel.js";
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ receiver: userId })
      .populate("sender", "username profilePic")
      .populate("post", "_id") // chỉ lấy _id của post
      .populate("reply", "_id text")
      .populate("message", "_id text")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(notifications);
  } catch (err) {
    console.error("Error in getNotifications:", err.message);
    return res.status(500).json({ error: "Error fetching notifications" });
  }
};

export const markNotificationsAsRead = async (req, res) => {
  try {
    const updatedNotifications = await Notification.updateMany(
      { receiver: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({ message: "Notifications marked as read" });
  } catch (err) {
    console.error(err.message);
    return res
      .status(500)
      .json({ error: "Error marking notifications as read" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await notification.deleteOne();

    return res
      .status(200)
      .json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Error deleting notification" });
  }
};
