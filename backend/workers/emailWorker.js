import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import emailService from "../config/email.config.js";

const emailWorker = new Worker(
  "emails",
  async (job) => {
    const { to, templateId, data } = job.data;
    await emailService(to, templateId, data);
  },
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
      max: 5,
      duration: 1000,
    },
    removeOnComplete: true,
    removeOnFail: true,
  }
);

emailWorker.on("completed", (job) => {
  console.log(`✅ Email sent to ${job.data.to}`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ Failed to send email to ${job.data.to}:`, err.message);
});
