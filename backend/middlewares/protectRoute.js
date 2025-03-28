import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      // Nếu không có token, vẫn cho phép request tiếp tục
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return next();
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return next();
    }

    req.user = user;
    next();
  } catch (err) {
    // Nếu có lỗi, vẫn cho phép request tiếp tục
    next();
  }
};

export default protectRoute;
