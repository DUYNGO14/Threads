import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.config.js";

export const interactionQueue = new Queue("user-interactions", {
  connection: redisConnection,
});

export const logUserInteraction = async ({ userId, postId, actionType }) => {
  await interactionQueue.add(
    "log-interaction",
    {
      userId,
      postId,
      actionType,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      jobId: `${userId}:${postId}:${actionType}`, // để tránh trùng job nếu muốn
      priority: 2,
      removeOnComplete: true,
      removeOnFail: { count: 3 },
    }
  );
};
