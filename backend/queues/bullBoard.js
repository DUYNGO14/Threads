import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js"; // ✅ thêm .js
import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.config.js";

// Tạo queue BullMQ
const notificationQueue = new Queue("notifications", {
  connection: redisConnection,
});

// Adapter cho Express
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

// Khởi tạo Bull Board
createBullBoard({
  queues: [new BullMQAdapter(notificationQueue)],
  serverAdapter,
});

export { serverAdapter };
