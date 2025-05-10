import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: String,
      default: "",
    },
    media: [
      {
        url: { type: String, required: true }, // URL của file
        type: {
          type: String,
          enum: ["image", "video", "audio", "gif"],
          required: true,
        }, // Kiểu file
        public_id: String, // ID của file trong Cloudinary
      },
    ],
    seen: {
      type: Boolean,
      default: false,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    systemType: {
      type: String,
      enum: ["join", "leave", "kick", "rename", "create"],
      default: null,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
