import { useState } from "react";

export default function useEmojiHandler() {
  const [messageText, setMessageText] = useState("");

  const handleEmojiClick = (emoji) => {
    setMessageText((prev) => prev + emoji.emoji);
  };

  const resetMessageText = () => setMessageText("");

  return {
    messageText,
    setMessageText,
    handleEmojiClick,
    resetMessageText,
  };
}
