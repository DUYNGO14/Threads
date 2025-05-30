import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import Notification from "../models/notificationModel.js";
import { io } from "../setup/setupServer.js";
import { getRecipientSocketId } from "../utils/socketUsers.js";
import { populateNotification } from "../utils/populateNotification.js";

const notificationWorker = new Worker(
  "notifications",
  async (job) => {
    const { sender, receivers, type, content, post, reply, message } = job.data;

    const receiverList = Array.isArray(receivers) ? receivers : [receivers];

    for (const receiverId of receiverList) {
      if (!receiverId) continue;

      const notificationData = {
        type,
        receiver: receiverId,
        content,
        ...(type !== "system" && { sender }),
        ...(post && { post }),
        ...(reply && type !== "reply" && { reply }),
        ...(message && { message }),
      };

      let existing = null;

      if (type !== "system") {
        const query = {
          type,
          receiver: receiverId,
          ...(sender && { sender }),
          ...(post && { post }),
          ...(reply && type !== "reply" && { reply }),
          ...(message && { message }),
        };

        existing = await Notification.findOne(query).lean();
      }

      if (existing) {
        await Notification.updateOne(
          { _id: existing._id },
          {
            isValid: true,
            createdAt: Date.now(),
          }
        );
        continue;
      }

      const notification = await Notification.create(notificationData);

      const recipientSocketId = getRecipientSocketId(receiverId.toString());
      if (recipientSocketId) {
        const populated = await populateNotification(notification._id);
        io.to(recipientSocketId).emit("notification:new", populated);
      }
    }
  },
  {
    connection: redisConnection,
  }
);

// Logging
notificationWorker.on("completed", (job) => {
  console.log(`✅ Notification job ${job.id} completed`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`❌ Notification job ${job.id} failed:`, err);
});
