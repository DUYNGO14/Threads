import express from "express";
import passport from "passport";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import {
  forgotPassword,
  loginUser,
  logoutUser,
  resendOTP,
  resetPassword,
  signupUser,
  verifyEmail,
} from "../controllers/authController.js";

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
    if (err) {
      return res.redirect(
        `${process.env.CLIENT_URL}/oauth-failure?error=${encodeURIComponent(
          "Đăng nhập thất bại. Vui lòng thử lại."
        )}`
      );
    }

    if (!user) {
      return res.redirect(
        `${process.env.CLIENT_URL}/oauth-failure?error=${encodeURIComponent(
          info?.message || "Đăng nhập thất bại."
        )}`
      );
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.redirect(
          `${process.env.CLIENT_URL}/oauth-failure?error=${encodeURIComponent(
            "Đăng nhập thất bại."
          )}`
        );
      }

      generateTokenAndSetCookie(user._id, res);
      res.cookie("userData", JSON.stringify(user), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
      });

      res.redirect(`${process.env.CLIENT_URL}/oauth-success`);
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
  passport.authenticate("facebook", (err, user, info) => {
    if (err) {
      console.error("🔥 Lỗi OAuth Facebook:", err.message || err);
      return res.redirect(
        `${process.env.CLIENT_URL}/oauth-failure?error=${encodeURIComponent(
          err.message || "Đăng nhập thất bại."
        )}`
      );
    }

    if (!user) {
      console.warn("⚠ OAuth Facebook thất bại:", info?.message);
      return res.redirect(
        `${process.env.CLIENT_URL}/oauth-failure?error=${encodeURIComponent(
          info?.message || "Đăng nhập thất bại."
        )}`
      );
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error("🔥 Lỗi đăng nhập:", loginErr);
        return res.redirect(
          `${process.env.CLIENT_URL}/oauth-failure?error=${encodeURIComponent(
            "Đăng nhập thất bại."
          )}`
        );
      }

      generateTokenAndSetCookie(user._id, res);
      res.cookie("userData", JSON.stringify(user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
      });

      res.redirect(`${process.env.CLIENT_URL}/oauth-success`);
    });
  })(req, res, next);
});

router.get("/me", (req, res) => {
  const userData = req.cookies.userData;
  if (!userData) return res.status(401).json({ message: "Not authenticated" });
  res.clearCookie("userData");
  res.json(JSON.parse(userData));
});

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/verify-account", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:resetToken", resetPassword);
router.post("/resend-otp", resendOTP);
export default router;
