import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import { sendMessage, getMessages } from "../controllers/messageController.js";

import { uploadMedia } from "../middlewares/multer.js";
const router = express.Router();
router.get("/:otherUserId", protectRoute, getMessages);
router.post("/", protectRoute, protectRoute, uploadMedia, sendMessage);
export default router;
