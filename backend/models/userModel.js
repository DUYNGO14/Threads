import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      minLength: 6,
      required: function () {
        return !this.googleId && !this.facebookId;
      },
    },
    profilePic: {
      type: String,
      default: "",
    },
    dob: {
      type: Date,
      default: null,
    },
    followers: {
      type: [String],
      default: [],
    },
    following: {
      type: [String],
      default: [],
    },
    reposts: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
        },
      ],
      default: [],
    },
    bio: {
      type: String,
      default: "",
    },
    isFrozen: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationOTP: String,
    verificationOTPExpiresAt: Date,
    googleId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },
    socialLinks: {
      type: Map,
      of: String, // Lưu trữ liên kết dạng chuỗi (URL)
      default: {},
    },
  },
  {
    timestamps: true,
  }
);
// Thêm chỉ mục văn bản cho các trường 'username' và 'name' để hỗ trợ tìm kiếm
userSchema.index({ username: "text", name: "text" });

const User = mongoose.model("User", userSchema);

export default User;
