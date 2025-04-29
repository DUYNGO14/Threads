import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const protectRoute = async (req, res, next) => {
  const allowedUrls = ["/api/users/suggested", "/api/posts/propose"];
  const isAllowedRoute = allowedUrls.some((url) =>
    req.originalUrl.startsWith(url)
  );

  // Kiểm tra nếu route cho phép không cần token
  if (isAllowedRoute) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.userId).select("-password");
      } catch (err) {
        console.error("Token decode error:", err.message);
      }
    }
    return next();
  }

  // Các route yêu cầu token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Unauthorized. No access token provided." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Token missing." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select("-password");
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. User not found." });
    }
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res
      .status(401)
      .json({ error: "Unauthorized. Invalid or expired access token." });
  }
};

export default protectRoute;
