import express from "express";
import {
  createPost,
  deletePost,
  getFeedPosts,
  getPost,
  getUserPosts,
  likeUnlikePost,
  replyToPost,
  getAllPosts,
} from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";
import multer from "multer";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.get("/followed", protectRoute, getFeedPosts);
router.get("/propose", protectRoute, getAllPosts);
router.get("/:id", getPost);
router.get("/user/:username", getUserPosts);
router.post("/create", protectRoute, upload.array("media", 5), createPost);
router.delete("/:id", protectRoute, deletePost);
router.put("/like/:id", protectRoute, likeUnlikePost);
router.put("/reply/:id", protectRoute, replyToPost);
export default router;
