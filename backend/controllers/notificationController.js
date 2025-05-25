import Notification from "../models/notificationModel.js";
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      receiver: req.user._id,
    })
      .populate("sender", "username profilePic")
      .populate("post", "content")
      .populate("reply", "text")
      .populate("message", "text")
      .sort({ createdAt: -1 });

    return res.status(200).json(notifications);
  } catch (err) {
    console.error(err.message);
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
