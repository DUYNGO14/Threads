import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const protectRoute = async (req, res, next) => {
  const allowedUrls = [
    "/api/users/suggested",
    "/api/posts/propose",
    "/api/posts/suggests",
    "/api/posts/recommended",
    "/api/users/search",
    "/api/users/search/:query",
    "/api/posts/feed",
  ];

  const isAllowedRoute = allowedUrls.some((url) =>
    req.originalUrl.startsWith(url)
  );

  // 🔍 Lấy JWT từ Header
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  // 🔄 Xử lý JWT
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (user) {
        req.user = user;
      } else {
        console.warn("⚠️ User not found for decoded token.");
        req.user = null;
      }
    } catch (err) {
      console.error("❌ JWT decode error:", err.message);
      req.user = null;
    }
  } else {
    req.user = null; // Không có token hoặc không hợp lệ
  }

  // ✅ Nếu là route công khai, cho phép tiếp tục
  if (isAllowedRoute) {
    return next();
  }

  // 🔒 Nếu là route bảo mật, kiểm tra user
  if (!req.user) {
    console.error("🔒 Unauthorized access attempt:", req.originalUrl);
    return res
      .status(401)
      .json({ error: "Unauthorized. Valid access token required." });
  }

  console.log("🔓 Authorized access for user:", req.user.username);
  next();
};

export default protectRoute;
