import jwt from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_EXPIRES_IN_REFRESH } from "../../constants.js";
const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET_REFRESH, {
    expiresIn: JWT_EXPIRES_IN_REFRESH,
  });
  res.cookie("jwt", token, {
    httpOnly: true, // more secure
    //secure: process.env.NODE_ENV !== "development",
    sameSite: "strict", // CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};
export default generateTokenAndSetCookie;
