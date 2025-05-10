import { useCallback } from "react";
import api from "../services/api";
import { useState } from "react";
import { set } from "lodash";

export const useMessageActions = () => {
  const [error, setError] = useState(null);
  const deleteMessage = useCallback(async (message) => {
    try {
      const res = await api.delete(`/api/messages/${message._id}`);
      return res;
    } catch (err) {
      setError(err.response?.data || "Something went wrong");
    }
  }, []);

  const updateMessage = useCallback(async (message, newText) => {
    try {
      console.log(message, newText);
      const res = await api.put(`/api/messages/${message._id}`, {
        text: newText,
      });
      return res.data.updatedMessage;
    } catch (err) {
      setError(err.response?.data || "Something went wrong");
    }
  }, []);

  return { deleteMessage, updateMessage };
};
