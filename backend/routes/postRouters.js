import express from "express";
import {
  createPost,
  deletePost,
  getFollowingPosts,
  getPost,
  getUserPosts,
  likeUnlikePost,
  replyToPost,
  getAllPosts,
  repost,
  getReposts,
  getTags,
  updatePost,
  getFeed,
  getRecommendPost,
} from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";
import multer from "multer";
import { uploadMedia } from "../middlewares/multer.js";
import { createPostLimiter } from "../middlewares/rateLimiter.js";
const router = express.Router();
const upload = multer({ dest: "uploads/" });
router.get("/followed", protectRoute, getFollowingPosts);
router.get("/propose", protectRoute, getAllPosts);
router.get("/tags", protectRoute, getTags);
router.get("/reposts/:username", getReposts);
router.get("/user/:username", getUserPosts);
router.get("/feed", protectRoute, getFeed);
router.get("/recommended", protectRoute, getRecommendPost);
router.get("/:id", getPost);

router.post(
  "/create",
  protectRoute,
  uploadMedia,
  createPostLimiter,
  createPost
);
router.delete("/:id", protectRoute, deletePost);
router.put("/like/:id", protectRoute, likeUnlikePost);
router.put("/reply/:id", protectRoute, replyToPost);
router.put("/:postId/update", protectRoute, uploadMedia, updatePost);
router.put("/repost/:id", protectRoute, repost);

export default router;
