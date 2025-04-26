import Notification from "../models/notificationModel.js";

// Map từng loại notification với các field cần populate
const populateMap = {
  like: ["post"],
  repost: ["post"],
  comment: ["post"],
  reply: ["post", "reply"],
  message: ["message"],
  follow: [], // follow chỉ cần sender
};

/**
 * Lấy notification đã populate tùy theo type
 * @param {String} notificationId
 * @returns {Object|null}
 */
export const populateNotification = async (notificationId) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) return null;

  let query = Notification.findById(notificationId).populate(
    "sender",
    "username profilePic"
  );

  const fields = populateMap[notification.type] || [];
  fields.forEach((field) => {
    if (field === "post") {
      query = query.populate("post", "text media");
    }
    if (field === "reply") {
      query = query.populate("reply", "text");
    }
    if (field === "message") {
      query = query.populate("message", "text media");
    }
  });

  const populated = await query;
  return populated;
};
