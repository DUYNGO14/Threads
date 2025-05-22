// queues/notificationWorker.js
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
      const query = {
        sender,
        receiver: receiverId,
        type,
        ...(type !== "reply" && reply && { reply }),
        ...(post && { post }),
        ...(message && { message }),
      };

      const existing = await Notification.findOne(query).lean();

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

      const notification = await Notification.create({
        sender,
        receiver: receiverId,
        type,
        content,
        ...(post && { post }),
        ...(reply && { reply }),
        ...(message && { message }),
      });

      const recipientSocketId = getRecipientSocketId(receiverId.toString());
      if (recipientSocketId) {
        const populated = await populateNotification(notification._id);
        io.to(recipientSocketId).emit("notification:new", populated);
      }
    }
  },
  {
    connection: redisConnection,
    removeOnComplete: true,
    removeOnFail: true,
  }
);

notificationWorker.on("completed", (job) => {
  console.log(`Notification job ${job.id} completed`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`Notification job ${job.id} failed:`, err);
});
