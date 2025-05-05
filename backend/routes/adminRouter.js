import express from "express";
import {
  toggleBlockUser,
  getAllUsers,
  updatePostStatus,
  getRegisteredUsersByWeek,
  getPostsByWeek,
  getPostByStatus,
  getGrowthStats,
  getReportStatisticsByMonthOrYear,
  getPostsByStatus,
} from "../controllers/adminController.js";
import protectRoute from "../middlewares/protectRoute.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { getReports } from "../controllers/reportController.js";

const router = express.Router();

router.use(protectRoute, requireAdmin);

router.get("/users", protectRoute, requireAdmin, getAllUsers);
router.put("/user/:userId/block", protectRoute, requireAdmin, toggleBlockUser);
router.put(
  "/post/:postId/status",
  protectRoute,
  requireAdmin,
  updatePostStatus
);
router.get(
  "/statistics/users/registered",
  protectRoute,
  requireAdmin,
  getRegisteredUsersByWeek
);
router.get(
  "/statistics/posts/created",
  protectRoute,
  requireAdmin,
  getPostsByWeek
);
router.get(
  "/statistics/posts/status",
  protectRoute,
  requireAdmin,
  getPostByStatus
);
router.get(
  "/report/statistics",
  protectRoute,
  requireAdmin,
  getReportStatisticsByMonthOrYear
);
router.get("/growth", protectRoute, requireAdmin, getGrowthStats);
router.get("/reports", protectRoute, requireAdmin, getReports);
router.get("/posts", protectRoute, requireAdmin, getPostsByStatus);

export default router;
