import Notification from "../models/notificationModel.js";
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      receiver: req.user._id, // Lọc theo người nhận
    })
      .populate("sender", "username profilePic")
      .populate("post", "content")
      .populate("reply", "text")
      .populate("message", "text")
      .sort({ createdAt: -1 }); // Sắp xếp theo thời gian

    res.status(200).json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error fetching notifications" });
  }
};
export const markNotificationsAsRead = async (req, res) => {
  try {
    const updatedNotifications = await Notification.updateMany(
      { receiver: req.user._id, isRead: false }, // Chỉ cập nhật các thông báo chưa đọc
      { $set: { isRead: true } } // Đánh dấu là đã đọc
    );

    res.status(200).json({ message: "Notifications marked as read" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error marking notifications as read" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      // Kiem tra xem thong bao co ton tai khong
      return res.status(404).json({ error: "Notification not found" });
    }

    await notification.deleteOne();

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error deleting notification" });
  }
};
