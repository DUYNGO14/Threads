import Reply from "../models/replyModel.js";
import Post from "../models/postModel.js";
import { moderateTextSmart } from "../utils/moderateText.js";

const getComment = async (req, res) => {
  try {
    const { id } = req.params; // ID của comment được truyền qua params
    const comment = await Reply.findById(id).populate(
      "repliedBy",
      "_id username name profilePic"
    );

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log("Error in getComment: ", error.message);
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
    const moderatedText = await moderateText(text);
    if (!moderatedText.ok) {
      return res.status(400).json({ error: moderatedText.message });
    }

    // Cập nhật comment
    comment.text = moderatedText.cleanedText;
    comment.originalText = text;
    await comment.save();

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log("Error in updateComment: ", error.message);
  }
};

const deleteComment = async (req, res) => {
  try {
    const { postId, repliesId } = req.params; // Lấy postId và replyId từ URL
    console.log(postId, repliesId);
    // Tìm bài viết chứa reply
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Tìm reply trong bài viết
    const replyIndex = post.replies.findIndex(
      (reply) => reply._id.toString() === repliesId
    );
    if (replyIndex === -1) {
      return res.status(404).json({ error: "Reply not found" });
    }

    // Xóa reply
    post.replies.splice(replyIndex, 1); // Xóa reply khỏi mảng replies của bài viết
    await post.save(); // Lưu lại bài viết với danh sách replies đã được cập nhật

    res.status(200).json({
      success: true,
      message: "Reply deleted successfully",
      repliesId,
    });
  } catch (error) {
    console.log("Error in deleteReply: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
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

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log("Error in getUserComments: ", error.message);
  }
};

export { getComment, updateComment, deleteComment, getUserComments };
