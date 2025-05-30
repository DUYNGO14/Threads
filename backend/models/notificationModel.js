import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Custom validator: nếu type != 'system' thì bắt buộc có sender
      validate: {
        validator: function (v) {
          if (this.type === "system") return v == null;
          return v != null;
        },
        message: "Sender is required unless the type is 'system'.",
      },
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "like",
        "reply",
        "follow",
        "tag",
        "message",
        "post",
        "report",
        "repost",
        "system",
      ],
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    reply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reply",
      default: null,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isValid: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware: tự động set sender = null nếu là system
notificationSchema.pre("validate", function (next) {
  if (this.type === "system") {
    this.sender = null;
  }
  next();
});

// Index phục vụ truy vấn nhanh các thông báo chưa đọc
notificationSchema.index({ receiver: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
