import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import {
  getComment,
  deleteComment,
  updateComment,
  getUserComments,
} from "../controllers/repliesController.js";
const router = express.Router();

router.get("/", protectRoute, getUserComments);
router.get("/:id", getComment);
router.put("/:id", protectRoute, updateComment);
router.delete("/:repliesId", protectRoute, deleteComment);

export default router;
