import mongoose from "mongoose";

const replySchema = mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    originalText: {
      type: String,
      required: true,
    },
    userProfilePic: {
      type: String,
    },
    username: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Reply = mongoose.model("Reply", replySchema);

export default Reply;
