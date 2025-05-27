import { useCallback } from "react";
import api from "../services/api";
import { useState } from "react";
import { set } from "lodash";

export const useMessageActions = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const deleteMessage = useCallback(async (message) => {
    try {
      setIsLoading(true);
      const res = await api.delete(`/api/messages/${message._id}`);
      return res;
    } catch (err) {
      setError(err.response?.data || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateMessage = useCallback(async (message, newText) => {
    try {
      setIsLoading(true);
      console.log(message, newText);
      const res = await api.put(`/api/messages/${message._id}`, {
        text: newText,
      });
      return res.data.updatedMessage;
    } catch (err) {
      setError(err.response?.data || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { deleteMessage, updateMessage, error, isLoading };
};
