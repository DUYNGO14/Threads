import express from "express";
import {
  deleteConversation,
  initiateConversation,
  getConversations,
  createGroupConversation,
  addMembersToGroup,
  removeUserFromGroup,
  deleteGroupConversation,
  leaveGroupConversation,
  updateNameGroup,
} from "../controllers/conversationController.js";
import protectRoute from "../middlewares/protectRoute.js";
import { createGroupLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.get("/", protectRoute, getConversations);
router.post(
  "/group",
  protectRoute,
  createGroupLimiter,
  createGroupConversation
);
router.post("/initiate", protectRoute, initiateConversation);
router.delete("/delete/:conversationId", protectRoute, deleteConversation);
router.put(
  "/group/add-member/:conversationId",
  protectRoute,
  addMembersToGroup
);
router.put(
  "/group/remove-member/:conversationId",
  protectRoute,
  removeUserFromGroup
);
router.delete("/group/:conversationId", protectRoute, deleteGroupConversation);
router.put(
  "/group/leave/:conversationId",
  protectRoute,
  leaveGroupConversation
);
router.put("/:conversationId/rename", protectRoute, updateNameGroup);

export default router;
