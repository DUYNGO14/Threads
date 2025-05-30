import mongoose from "mongoose";

const recentInteractionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "reply", "repost"],
      required: true,
    },
    interactedAt: {
      type: Date,
      default: Date.now,
    },
    postOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    postTags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const RecentInteraction = mongoose.model(
  "RecentInteraction",
  recentInteractionSchema
);
export default RecentInteraction;
