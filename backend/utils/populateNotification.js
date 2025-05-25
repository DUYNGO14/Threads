import Notification from "../models/notificationModel.js";

const populateMap = {
  like: ["post"],
  repost: ["post"],
  comment: ["post"],
  reply: ["post", "reply"],
  message: ["message"],
  follow: [],
};

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
