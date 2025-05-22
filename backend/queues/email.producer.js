import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.config.js";

export const emailQueue = new Queue("emails", {
  connection: redisConnection,
});

export const addEmailJob = async ({ to, templateId, data }) => {
  await emailQueue.add(
    "send-email",
    { to, templateId, data },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { count: 3 },
      removeOnFail: { count: 3 },
    }
  );
};
