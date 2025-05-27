import { useState } from "react";
import useShowToast from "@hooks/useShowToast";
import api from "../services/api";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  conversationsAtom,
  selectedConversationAtom,
} from "../atoms/messagesAtom";

export default function useSendMessage(
  setMessages,
  resetInput,
  getMessageText,
  getMediaFiles
) {
  const [isSending, setIsSending] = useState(false);
  const showToast = useShowToast();
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const setConversations = useSetRecoilState(conversationsAtom);

  const handleSendMessage = async () => {
    const messageText = getMessageText();
    const mediaFiles = getMediaFiles();

    if ((!messageText.trim() && mediaFiles.length === 0) || isSending) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      if (messageText.trim()) formData.append("message", messageText.trim());
      formData.append("conversationId", selectedConversation._id);

      mediaFiles.forEach((file) => formData.append("media", file));

      const res = await api.post("/api/messages", formData);
      const data = await res.data;

      if (data.error) return showToast("Error", data.error, "error");

      setMessages((prev) => [...prev, data]);

      setConversations((prevConvs) =>
        prevConvs.map((conv) =>
          conv._id === selectedConversation._id
            ? {
                ...conv,
                lastMessage: {
                  text:
                    messageText || (mediaFiles.length > 0 ? "📎 Media" : ""),
                  sender: data.sender,
                },
              }
            : conv
        )
      );

      resetInput();
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsSending(false);
    }
  };

  return { handleSendMessage, isSending };
}
