import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
      enum: ["like", "reply", "follow", "tag", "message", "post"],
      required: true,
    },

    // Optional references depending on type
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

    // Status flags
    isRead: {
      type: Boolean,
      default: false,
    },

    // Future-proofing: moderation, link, or other metadata
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
notificationSchema.index({ receiver: 1, isRead: 1, createdAt: -1 });
export default mongoose.model("Notification", notificationSchema);
