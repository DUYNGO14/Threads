import jwt from "jsonwebtoken";
import {
  JWT_EXPIRES_IN,
  JWT_EXPIRES_IN_REFRESH,
} from "../../constants/token.js";
const generateTokenAndSetCookie = (userId, res) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET_REFRESH, {
    expiresIn: JWT_EXPIRES_IN_REFRESH,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // more secure
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return accessToken;
};
export default generateTokenAndSetCookie;
