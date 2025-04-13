// routes/conversationRoutes.js
import express from "express";
import {
  deleteConversation,
  initiateConversation,
  getConversations,
} from "../controllers/conversationController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.get("/", protectRoute, getConversations);
router.post("/initiate", protectRoute, initiateConversation);
router.delete("/delete/:conversationId", protectRoute, deleteConversation);
export default router;
