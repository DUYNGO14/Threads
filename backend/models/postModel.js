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
      enum: ["pending", "approved", "rejected", "pending_review"],
      default: "pending",
    },
    text: {
      type: String,
      maxLength: 500,
      required: true,
    },
    media: [
      {
        url: { type: String, required: true }, // URL của file
        type: {
          type: String,
          enum: ["image", "video", "audio"],
          required: true,
        }, // Kiểu file
        public_id: String, // ID của file trong Cloudinary
      },
    ],
    likes: {
      // array of user ids
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    repostedBy: {
      // array of user ids who reposted this post
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reply", // Tham chiếu tới model Reply
      },
    ],
    tags: {
      // Các tag tự động được gán từ nội dung bài viết
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
