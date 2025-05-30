import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processing"],
      default: "pending",
    },
    text: {
      type: String,
      maxLength: 500,
      required: true,
    },
    taggedFriends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    media: [
      {
        url: { type: String, required: true },
        type: {
          type: String,
          enum: ["image", "video", "audio"],
          required: true,
        }, // Kiểu file
        public_id: String,
        width: Number,
        height: Number,
      },
    ],
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    repostedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reply",
      },
    ],
    tags: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
postSchema.index({ status: 1 });
postSchema.index({ likes: 1 });
postSchema.index({ repostedBy: 1 });
const Post = mongoose.model("Post", postSchema);

export default Post;
