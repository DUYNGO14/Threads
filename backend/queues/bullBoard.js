import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js"; // ✅ thêm .js
import { notificationQueue } from "./notification.producer.js";
import { emailQueue } from "./email.producer.js";
import { interactionQueue } from "./userInteraction.producer.js";

// Adapter cho Express
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

// Khởi tạo Bull Board
createBullBoard({
  queues: [
    new BullMQAdapter(notificationQueue),
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(interactionQueue),
  ],
  serverAdapter,
});

export { serverAdapter };
