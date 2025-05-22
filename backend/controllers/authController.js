import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../utils/helpers/sendEmail.js";
import jwt from "jsonwebtoken";
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
const signupUser = async (req, res) => {
  try {
    const { name, username, email, dob, password } = req.body;

    // Kiểm tra xem username hoặc email đã tồn tại chưa
    const userExist = await User.findOne({ $or: [{ username }, { email }] });
    if (userExist && !userExist.facebookId && !userExist.googleId)
      return res
        .status(400)
        .json({ error: "Username or email  already exists" });
    else if (userExist && (userExist.facebookId || userExist.googleId)) {
      return res.status(400).json({
        error: "This account was registered with Google or Facebook. ",
      });
    }
    // Băm mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationOTP = generateOTP();
    // Tạo user mới
    const newUser = await User.create({
      name,
      username,
      email,
      dob,
      password: hashedPassword,
      verificationOTP,
      verificationOTPExpiresAt: Date.now() + 60 * 1000, // 1 minutes
    });

    // Tạo token và gửi cookie

    //send email verification
    await sendVerificationEmail(
      email,
      newUser.name || newUser.username,
      verificationOTP
    );

    // Trả về thông tin user (loại bỏ mật khẩu)
    return res.status(201).json({
      success: true,
      message: "Email verified successfully",
      data: {
        _id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        verificationOTP,
        verificationOTPExpiresAt: newUser.verificationOTPExpiresAt,
      },
    });
  } catch (error) {
    console.error("Error in signupUser:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//login
const loginUser = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Kiểm tra xem user có tồn tại không
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    })
      .select("+password")
      .lean();
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    if (!user.password) {
      return res.status(400).json({
        error: "Tài khoản này được tạo bằng Google hoặc Facebook.",
      });
    }
    if (user.isVerified === false) {
      return res.status(400).json({ error: "Account not verified." });
    }
    if (user.isBlocked === true) {
      return res.status(400).json({ error: "Account is blocked." });
    }
    // Kiểm tra mật khẩu có đúng không
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Tạo token và gửi cookie
    const accessToken = generateTokenAndSetCookie(user._id, res);

    // Cập nhật trạng thái user (nếu cần)
    await User.findByIdAndUpdate(user._id, { isFrozen: false });

    // Trả về dữ liệu user (trừ password)
    return res.status(200).json({
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        role: user.role,
        isVerified: user.isVerified,
        isFrozen: user.isFrozen,
      },
    });
  } catch (error) {
    console.error("Error in loginUser:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logoutUser:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    // Tạo OTP mới
    const newOTP = generateOTP();
    user.verificationOTP = newOTP;
    user.verificationOTPExpiresAt = Date.now() + 60 * 1000; // 1 phút

    await user.save();
    //send email verification
    await sendVerificationEmail(email, user.name || user.username, newOTP);

    return res.json({ success: true, message: "OTP has been resent" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await User.findOne({
      email,
      verificationOTP: code,
      verificationOTPExpiresAt: { $gt: Date.now() },
    });
    console.log(user);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired verification code",
      });
    }

    // Đánh dấu là đã xác thực
    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpiresAt = undefined;
    await user.save();

    // Gửi email chào mừng (nếu cần)
    // await sendWelcomeEmail(user.email, user.name);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.log("Error in verifyEmail:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

//forgot password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, error: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: "This account was registered with Google or Facebook.",
      });
    }

    // Tạo token gốc và mã hóa
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Lưu token mã hóa và thời gian hết hạn
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiresAt = Date.now() + 5 * 60 * 1000; // 5 phút
    await user.save();

    // Gửi email chứa token gốc
    await sendPasswordResetEmail(
      user.email,
      user.name || user.username,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.log("Error in forgotPassword:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
//reset password
const resetPassword = async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 5) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 5 characters long.",
      });
    }

    // Hash lại token nhận được từ URL
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    // Tìm user dựa trên token mã hóa và thời gian còn hạn
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (user === null) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    // Cập nhật mật khẩu và xoá token cũ
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
};
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid current password" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Error in changePassword:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
};
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -updatedAt"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in getMe:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_REFRESH);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ error: "Invalid refresh token: user not found" });
    }

    const accessToken = generateTokenAndSetCookie(user._id, res);
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Error in refreshToken:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Refresh token expired" });
    }

    return res.status(403).json({ error: "Invalid refresh token" });
  }
};

const checkToken = async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1]; // Lấy access token từ header
  if (!accessToken) {
    return res.status(200).json({ success: false });
  }

  try {
    jwt.verify(accessToken, process.env.JWT_SECRET); // Kiểm tra token
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(401).json({ success: false });
  }
};

export {
  loginUser,
  signupUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logoutUser,
  resendOTP,
  changePassword,
  getMe,
  refreshToken,
  checkToken,
};
