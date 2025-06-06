import express from "express";
import passport from "passport";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import {
  changePassword,
  checkToken,
  forgotPassword,
  getMe,
  getUserFromToken,
  loginUser,
  logoutUser,
  refreshToken,
  resendOTP,
  resetPassword,
  signupUser,
  verifyEmail,
} from "../controllers/authController.js";
import protectRoute from "../middlewares/protectRoute.js";
import {
  loginLimiter,
  registerLimiter,
  otpLimiter,
} from "../middlewares/rateLimiter.js";

const router = express.Router();

// 🌐 Determine frontend client URL
const clientUrl =
  process.env.NODE_ENV === "production"
    ? "https://threads-0m08.onrender.com"
    : process.env.CLIENT_URL;

// ------------------------
// 🔐 Google OAuth Login
// ------------------------
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: true,
  })
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err || !user) {
      const errorMsg = encodeURIComponent(
        err?.message || info?.message || "Login failed. Please try again."
      );
      return res.redirect(`${clientUrl}/oauth-failure?error=${errorMsg}`);
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.redirect(
          `${clientUrl}/oauth-failure?error=${encodeURIComponent(
            "Login failed."
          )}`
        );
      }

      const accessToken = generateTokenAndSetCookie(user._id, res);
      res.redirect(`${clientUrl}/oauth-success?accessToken=${accessToken}`);
    });
  })(req, res, next);
});

// ------------------------
// 🔐 Facebook OAuth Login
// ------------------------
router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
  })
);

router.get("/facebook/callback", (req, res, next) => {
  passport.authenticate("facebook", (err, user, info) => {
    if (err || !user) {
      const errorMsg = encodeURIComponent(
        err?.message || info?.message || "Login failed. Please try again."
      );
      return res.redirect(`${clientUrl}/oauth-failure?error=${errorMsg}`);
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.redirect(
          `${clientUrl}/oauth-failure?error=${encodeURIComponent(
            "Login failed."
          )}`
        );
      }

      const accessToken = generateTokenAndSetCookie(user._id, res);
      res.redirect(`${clientUrl}/oauth-success?accessToken=${accessToken}`);
    });
  })(req, res, next);
});

// ------------------------
// 🧾 Standard Auth Routes
// ------------------------
router.get("/me", getUserFromToken);

router.post("/signup", registerLimiter, signupUser);
router.post("/login", loginLimiter, loginUser);
router.post("/logout", logoutUser);
router.get("/refresh-token", refreshToken);
router.get("/check", checkToken);

router.post("/verify-account", otpLimiter, verifyEmail);
router.post("/resend-otp", otpLimiter, resendOTP);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/reset-password/:resetToken", resetPassword);

router.put("/change-password", protectRoute, changePassword);
router.get("/user", protectRoute, getMe);

export default router;
