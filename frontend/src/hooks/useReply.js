import { useState } from "react";
import useShowToast from "@hooks/useShowToast";
import api from "../services/api.js";
/**
 * Custom hook để xử lý logic thêm / sửa / xoá reply trong một bài post.
 * @param {string} postId - ID của bài viết.
 * @param {(data: any) => void} onSuccess - Callback sau khi thao tác thành công (API trả về dữ liệu mới).
 */
const useReply = (postId, onSuccess) => {
  const [loading, setLoading] = useState(false);
  const showToast = useShowToast();

  // Gửi một reply mới
  const submitReply = async (text) => {
    setLoading(true);
    try {
      const res = await api.put(`/api/posts/reply/${postId}`, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.data;
      if (data.error) throw new Error(data.error);

      onSuccess(data); // Gọi callback với dữ liệu mới
      showToast("Success", "Reply added successfully", "success");
    } catch (err) {
      showToast("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Chỉnh sửa reply
  const editReply = async (replyId, text) => {
    setLoading(true);
    try {
      const res = await api.put(`/api/replies/${replyId}`, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.data;
      if (data.error) throw new Error(data.error);
      onSuccess(data);
      showToast("Success", "Reply edited successfully", "success");
    } catch (err) {
      showToast("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Xoá reply
  const deleteReply = async (replyId, postId) => {
    setLoading(true);
    try {
      const res = await api.delete(`/api/replies/${replyId}`, {
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.data;
      if (data.error) throw new Error(data.error);

      // Cập nhật lại state hoặc UI sau khi xóa reply
      onSuccess(data.repliesId); // Có thể gọi một callback để cập nhật UI nếu cần
      showToast("Success", "Reply deleted successfully", "success");
    } catch (err) {
      showToast("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    submitReply,
    editReply,
    deleteReply,
  };
};

export default useReply;
