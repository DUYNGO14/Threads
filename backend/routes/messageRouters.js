import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import {
  sendMessage,
  getMessages,
  deleteMessage,
  updatedMessage,
} from "../controllers/messageController.js";

import { uploadMedia } from "../middlewares/multer.js";
import { messageLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();
router.get("/", protectRoute, getMessages);

router.post("/", protectRoute, uploadMedia, messageLimiter, sendMessage);

router.delete("/:messageId", protectRoute, deleteMessage);

router.put("/:messageId", protectRoute, updatedMessage);

export default router;
