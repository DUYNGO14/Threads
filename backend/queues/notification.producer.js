import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.config.js";

export const notificationQueue = new Queue("notifications", {
  connection: redisConnection,
});

export const addNotificationJob = async (notificationData) => {
  await notificationQueue.add("send-notifications", notificationData, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: { count: 3 },
  });
};
