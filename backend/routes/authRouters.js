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
const router = express.Router();
//passport login google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: true,
  })
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    const clientUrl =
      process.env.NODE_ENV === "production"
        ? "https://threads-0m08.onrender.com"
        : process.env.CLIENT_URL;

    if (err) {
      return res.redirect(
        `${clientUrl}/oauth-failure?error=${encodeURIComponent(
          "Đăng nhập thất bại. Vui lòng thử lại."
        )}`
      );
    }

    if (!user) {
      return res.redirect(
        `${clientUrl}/oauth-failure?error=${encodeURIComponent(
          info?.message || "Đăng nhập thất bại."
        )}`
      );
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

//passport login facebook
router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email"], // ✅ Lấy email từ Facebook
  })
);

router.get("/facebook/callback", (req, res, next) => {
  const clientUrl =
    process.env.NODE_ENV === "production"
      ? "https://threads-0m08.onrender.com"
      : process.env.CLIENT_URL;
  passport.authenticate("facebook", (err, user, info) => {
    if (err) {
      console.error("🔥 Lỗi OAuth Facebook:", err.message || err);
      return res.redirect(
        `${clientUrl}/oauth-failure?error=${encodeURIComponent(
          err.message || "Đăng nhập thất bại."
        )}`
      );
    }

    if (!user) {
      console.warn("⚠ OAuth Facebook thất bại:", info?.message);
      return res.redirect(
        `${clientUrl}/oauth-failure?error=${encodeURIComponent(
          info?.message || "Đăng nhập thất bại."
        )}`
      );
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error("🔥 Lỗi đăng nhập:", loginErr);
        return res.redirect(
          `${clientUrl}/oauth-failure?error=${encodeURIComponent(
            "Đăng nhập thất bại."
          )}`
        );
      }

      const accessToken = generateTokenAndSetCookie(user._id, res);

      res.redirect(`${clientUrl}/oauth-success?accessToken=${accessToken}`);
    });
  })(req, res, next);
});

router.get("/me", getUserFromToken);

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/refresh-token", refreshToken);
router.get("/check", checkToken);
router.post("/verify-account", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:resetToken", resetPassword);
router.post("/resend-otp", resendOTP);
router.put("/change-password", protectRoute, changePassword);
router.get("/user", protectRoute, getMe);
export default router;
