import express from "express";
import {
  followUnFollowUser,
  updateUser,
  getUserProfile,
  getSuggestedUsers,
  freezeAccount,
  deleteAccount,
  getCurrentUserProfile,
  getListFollowers,
  getListFollowing,
  searchUsers,
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";
import { get } from "mongoose";

const router = express.Router();

router.get("/profile/me", protectRoute, getCurrentUserProfile);
router.get("/profile/:query", getUserProfile);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/follow/:id", protectRoute, followUnFollowUser); // Toggle state(follow/unfollow)
router.put("/update/:id", protectRoute, updateUser);
router.put("/freeze", protectRoute, freezeAccount);
router.post("/delete", protectRoute, deleteAccount);
router.get("/followed", protectRoute, getListFollowers);
router.get("/following", protectRoute, getListFollowing);
router.get("/search/:query", searchUsers);
export default router;
