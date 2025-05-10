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
  searchSuggestedUsers,
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";
import { getTags } from "../controllers/postController.js";
const router = express.Router();

router.get("/profile/me", protectRoute, getCurrentUserProfile);
router.get("/profile/:query", getUserProfile);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.get("/:username/followed", protectRoute, getListFollowers);
router.get("/:username/following", protectRoute, getListFollowing);
router.get("/search-suggested", protectRoute, searchSuggestedUsers);
router.get("/search", protectRoute, searchUsers);

router.get("/tags", protectRoute, getTags);
router.post("/follow/:id", protectRoute, followUnFollowUser); // Toggle state(follow/unfollow)
router.put("/update/:id", protectRoute, updateUser);
router.put("/freeze", protectRoute, freezeAccount);
router.post("/delete", protectRoute, deleteAccount);

export default router;
