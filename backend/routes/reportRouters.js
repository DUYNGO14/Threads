import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import {
  createReport,
  getReports,
  updateReportStatus,
  deleteReport,
} from "../controllers/reportController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

router.post("/", protectRoute, createReport);
router.get("/", protectRoute, requireAdmin, getReports);
router.put("/:reportId/status", protectRoute, requireAdmin, updateReportStatus);
router.delete("/:reportId", protectRoute, requireAdmin, deleteReport);

export default router;
