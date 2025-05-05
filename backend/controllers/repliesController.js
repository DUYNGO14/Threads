import Reply from "../models/replyModel.js";
import Post from "../models/postModel.js";
import { moderateTextSmart } from "../utils/moderateText.js";
import { sendNotification } from "../services/notificationService.js";
const getComment = async (req, res) => {
  try {
    const { id } = req.params; // Lấy ID của reply từ params
    const reply = await Reply.findById(id).populate(
      "userId",
      "_id username name profilePic"
    );

    if (!reply) {
      return res.status(404).json({ error: "Reply not found" });
    }

    return res.status(200).json(reply);
  } catch (error) {
    console.log("Error in getComment: ", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const updateComment = async (req, res) => {
  try {
    const { id } = req.params; // ID của comment cần cập nhật
    const { text } = req.body; // Trường cần cập nhật (text của comment)
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Text field is required" });
    }

    const comment = await Reply.findById(id);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    const moderatedText = await moderateTextSmart(text);
    if (!moderatedText.ok) {
      return res.status(400).json({ error: moderatedText.message });
    }

    // Cập nhật comment
    comment.text = moderatedText.cleanedText;
    comment.originalText = text;
    await comment.save();

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    console.log("Error in updateComment: ", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { repliesId } = req.params; // Lấy postId và replyId từ URL
    // Tìm bài viết chứa reply
    const reply = await Reply.findById(repliesId);
    if (!reply) {
      return res.status(404).json({ error: "Reply not found" });
    }

    // Kiểm tra quyền: chủ sở hữu hoặc admin
    if (
      reply.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Unauthorized to delete reply" });
    }

    // Xóa ID của reply khỏi mảng replies trong Post liên quan
    await Post.findByIdAndUpdate(reply.postId, {
      $pull: { replies: reply._id },
    });

    // Xóa reply
    await reply.deleteOne();
    if (req.user.role === "admin") {
      await sendNotification({
        sender: req.user,
        receivers: [reply.userId],
        type: "report",
        content: `Your comment has been deleted for violating community standards.`,
        post: reply.postId,
      });
    }

    return res.status(200).json({ message: "Reply deleted successfully" });
  } catch (err) {
    console.error("Error in deleteReply:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUserComments = async (req, res) => {
  try {
    const { userId } = req.params; // Lấy userId từ params (người dùng cần lấy comment)

    // Tìm tất cả các comment mà người dùng đã đăng
    const comments = await Reply.find({ repliedBy: userId })
      .populate("repliedBy", "_id username name profilePic") // Lấy thông tin người dùng (repliedBy)
      .sort({ createdAt: -1 }); // Sắp xếp theo thời gian tạo comment (mới nhất trước)

    if (!comments || comments.length === 0) {
      return res.status(404).json({ error: "No comments found for this user" });
    }

    return res.status(200).json(comments);
  } catch (error) {
    console.log("Error in getUserComments: ", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export { getComment, updateComment, deleteComment, getUserComments };
