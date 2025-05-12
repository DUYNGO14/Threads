import { useEffect } from "react";
import { useRecoilValue } from "recoil";
import { selectedConversationAtom } from "../atoms/messagesAtom";
import useShowToast from "./useShowToast";
import api from "../services/api";

const useInitialMessages = (setMessages, setHasMore) => {
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const showToast = useShowToast();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation?._id || selectedConversation.mock) return;

      setMessages([]);
      try {
        const endpoint = selectedConversation.isGroup
          ? `/api/messages?conversationId=${selectedConversation._id}`
          : `/api/messages?otherUserId=${selectedConversation.userId}`;

        const { data } = await api.get(endpoint);
        setMessages(data.messages);
        setHasMore(data.hasMore);
      } catch (err) {
        showToast("Error", err.message, "error");
      }
    };

    fetchMessages();
  }, [selectedConversation?._id]);

  return {
    loadingMessages: !selectedConversation?.mock && !selectedConversation?._id,
  };
};

export default useInitialMessages;
