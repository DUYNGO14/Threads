import rateLimit from "express-rate-limit";

// Helper to create limiter
const createLimiter = ({ windowMinutes, max, message }) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
  });

// 🔐 Login: prevent brute-force attacks
const loginLimiter = createLimiter({
  windowMinutes: 15,
  max: 10,
  message: "Too many login attempts. Please try again after 15 minutes.",
});

// 🆕 Register: prevent account spam
const registerLimiter = createLimiter({
  windowMinutes: 30,
  max: 5,
  message: "Too many registration attempts. Please try again after 30 minutes.",
});

// 📧 OTP / Email verification
const otpLimiter = createLimiter({
  windowMinutes: 15,
  max: 3,
  message: "Too many OTP requests. Please try again later.",
});

// 🔐 Sensitive actions like password change
const sensitiveActionLimiter = createLimiter({
  windowMinutes: 15,
  max: 5,
  message: "Too many sensitive actions. Please try again later.",
});

// 📝 Create post
const createPostLimiter = createLimiter({
  windowMinutes: 10,
  max: 10,
  message: "You are posting too quickly. Please try again in a few minutes.",
});

// 💬 Send chat message
const messageLimiter = createLimiter({
  windowMinutes: 5,
  max: 50,
  message: "You are sending messages too frequently. Please wait a moment.",
});

// 🔍 Search
const searchLimiter = createLimiter({
  windowMinutes: 5,
  max: 30,
  message:
    "You are searching too frequently. Please try again in a few minutes.",
});

// 📤 Upload media
const mediaUploadLimiter = createLimiter({
  windowMinutes: 10,
  max: 5,
  message: "You have uploaded too many files. Please try again later.",
});

// 🚨 Submit report or feedback
const reportLimiter = createLimiter({
  windowMinutes: 60,
  max: 3,
  message: "You have submitted too many reports. Please try again later.",
});

// 🌐 General API rate limit
const generalApiLimiter = createLimiter({
  windowMinutes: 15,
  max: 100,
  message:
    "You are making requests too quickly. Please slow down and try again.",
});

const createGroupLimiter = createLimiter({
  windowMinutes: 10,
  max: 5,
  message: "You are creating groups too quickly. Please wait a few minutes.",
});

export {
  loginLimiter,
  registerLimiter,
  otpLimiter,
  sensitiveActionLimiter,
  createPostLimiter,
  messageLimiter,
  searchLimiter,
  mediaUploadLimiter,
  reportLimiter,
  generalApiLimiter,
  createGroupLimiter,
};
