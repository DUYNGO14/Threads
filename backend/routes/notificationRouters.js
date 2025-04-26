import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import {
  getNotifications,
  markNotificationsAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
const router = express.Router();
router.get("/", protectRoute, getNotifications);
router.patch("/mark-all-read", protectRoute, markNotificationsAsRead);
router.delete("/delete/:notificationId", protectRoute, deleteNotification);
export default router;
