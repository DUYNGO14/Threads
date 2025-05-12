import { useEffect, useState } from "react";

const containsEmoji = (text) => {
  return /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu.test(text);
};

const useEmojiValidator = (fieldName, value) => {
  const [error, setError] = useState("");

  useEffect(() => {
    if (
      ["name", "username", "password"].includes(fieldName) &&
      containsEmoji(value)
    ) {
      setError("Icons or emojis are not allowed.");
    } else {
      setError("");
    }
  }, [fieldName, value]);

  return {
    error,
    isInvalid: !!error,
  };
};

export default useEmojiValidator;
