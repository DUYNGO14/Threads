import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    groupName: {
      type: String,
      required: function () {
        return this.isGroup;
      },
    },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isGroup: { type: Boolean, default: false }, // Đánh dấu đây là nhóm chat hay không
    lastMessage: {
      text: String,
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      seen: { type: Boolean, default: false },
      media: [
        {
          url: String,
          type: {
            type: String,
            enum: ["image", "video", "audio"],
          },
        },
      ],
      createdAt: { type: Date, default: Date.now },
    },
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
