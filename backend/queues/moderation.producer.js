import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.config.js";

export const moderationQueue = new Queue("moderation-queue", {
  connection: redisConnection,
});

export const addModerationJob = async (data) => {
  await moderationQueue.add("moderate-post", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 3 },
  });
};
