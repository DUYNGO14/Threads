import { useEffect, useRef } from "react";
import useShowToast from "./useShowToast";
import api from "../services/api";

const useMessageScroll = (
  containerRef,
  messages,
  setMessages,
  hasMore,
  setHasMore,
  setLoadingMore
) => {
  const showToast = useShowToast();
  const isFetching = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = async () => {
      if (
        container.scrollTop < 100 &&
        hasMore &&
        messages.length > 0 &&
        !isFetching.current
      ) {
        isFetching.current = true;
        setLoadingMore(true);

        const prevScrollHeight = container.scrollHeight;
        const oldest = messages[0];

        try {
          const endpoint = `/api/messages?conversationId=${oldest.conversationId}&before=${oldest.createdAt}`;
          const { data } = await api.get(endpoint);

          setMessages((prev) => [...data.messages, ...prev]);
          setHasMore(data.hasMore);

          // Đợi DOM render xong trước khi set lại scrollTop
          requestAnimationFrame(() => {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight;
          });
        } catch (err) {
          showToast("Error", err.message, "error");
        } finally {
          setLoadingMore(false);
          isFetching.current = false;
        }
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [
    containerRef,
    messages,
    hasMore,
    setMessages,
    setHasMore,
    setLoadingMore,
  ]);
};

export default useMessageScroll;
