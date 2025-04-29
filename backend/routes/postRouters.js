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
  getSuggestedPosts,
} from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";
import multer from "multer";
import { uploadMedia } from "../middlewares/multer.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.get("/followed", protectRoute, getFollowingPosts);
router.get("/propose", protectRoute, getAllPosts);
router.get("/suggests", protectRoute, getSuggestedPosts);
router.get("/reposts/:username", getReposts);
router.get("/:id", getPost);
router.get("/user/:username", getUserPosts);
router.post("/create", protectRoute, uploadMedia, createPost);
router.delete("/:id", protectRoute, deletePost);
router.put("/like/:id", protectRoute, likeUnlikePost);
router.put("/reply/:id", protectRoute, replyToPost);
router.put("/update/:id", protectRoute, upload.array("media", 10), createPost);
router.put("/repost/:id", protectRoute, repost);

export default router;
