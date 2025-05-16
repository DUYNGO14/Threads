import Notification from "../models/notificationModel.js";
import { io } from "../setup/setupServer.js";
import { getRecipientSocketId } from "../utils/socketUsers.js";
import { populateNotification } from "../utils/populateNotification.js";

/**
 * Gửi thông báo đến một hoặc nhiều người dùng, tránh spam
 */
export const sendNotification = async ({
  sender,
  receivers,
  type,
  content,
  post,
  reply,
  message,
}) => {
  try {
    if (!sender || !receivers || !type || !content) {
      throw new Error("Missing required fields for notification.");
    }

    const receiverList = Array.isArray(receivers) ? receivers : [receivers];

    const createdNotifications = [];

    for (const receiverId of receiverList) {
      const query = {
        sender: sender._id,
        receiver: receiverId,
        type,
        ...(type !== "reply" && reply && { reply }),
        ...(post && { post }),
        ...(message && { message }),
      };

      // Kiểm tra đã tồn tại chưa
      const existing = await Notification.findOne(query).lean();

      if (existing) {
        await Notification.updateOne(
          { _id: existing._id },
          {
            isValid: true,
            createdAt: Date.now(), // cập nhật lại thời gian
          }
        );
        // Nếu đã tồn tại rồi -> bỏ qua
        continue;
      }

      // Tạo mới nếu chưa có
      const notification = await Notification.create({
        sender: sender._id,
        receiver: receiverId,
        type,
        content,
        ...(post && { post }),
        ...(reply && { reply }),
        ...(message && { message }),
      });

      createdNotifications.push(notification);

      // Gửi realtime nếu người dùng online
      const recipientSocketId = getRecipientSocketId(receiverId.toString());
      if (recipientSocketId) {
        const populated = await populateNotification(notification._id);
        io.to(recipientSocketId).emit("notification:new", populated);
      }
    }

    return createdNotifications;
  } catch (err) {
    console.error("❌ sendNotification error:", err.message);
    return [];
  }
};
