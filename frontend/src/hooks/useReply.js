import { useState } from "react";
import useShowToast from "@hooks/useShowToast";
import api from "../services/api.js";

const useReply = (postId, onSuccess) => {
  const [loading, setLoading] = useState(false);
  const showToast = useShowToast();

  const submitReply = async (text) => {
    setLoading(true);
    try {
      const res = await api.put(
        `/api/posts/reply/${postId}`,
        { text },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.data;
      if (data.error) throw new Error(data.error);

      onSuccess(data);
      showToast("Success", "Reply added successfully", "success");
    } catch (err) {
      showToast("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Chỉnh sửa reply
  const editReply = async (replyId, reply) => {
    console.log(replyId, reply);
    setLoading(true);
    try {
      const res = await api.put(
        `/api/replies/${replyId}`,
        { text: reply },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.data;
      console.log(data);
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
      onSuccess(replyId);
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
