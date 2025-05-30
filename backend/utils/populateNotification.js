import Notification from "../models/notificationModel.js";

const populateMap = {
  like: [{ path: "post", select: "text media" }],
  repost: [{ path: "post", select: "text media" }],
  comment: [{ path: "post", select: "text media" }],
  reply: [
    { path: "post", select: "text media" },
    { path: "reply", select: "text" },
  ],
  message: [{ path: "message", select: "text media" }],
  follow: [],
  tag: [{ path: "post", select: "text media" }],
  post: [{ path: "post", select: "text media" }],
  system: [], // Không cần populate gì đặc biệt
};

export const populateNotification = async (notificationId) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) return null;

  const population = [];

  // Chỉ populate sender nếu có
  if (notification.sender) {
    population.push({ path: "sender", select: "username profilePic" });
  }

  // Populate các liên kết tùy theo loại thông báo
  const extraPopulates = populateMap[notification.type] || [];
  population.push(...extraPopulates);

  // Thực hiện populate 1 lần duy nhất
  const populated = await Notification.findById(notificationId).populate(
    population
  );

  return populated;
};
