import { useRef, useState } from "react";
import useShowToast from "@hooks/useShowToast";

export default function useMediaHandler(onOpen) {
  const [mediaFiles, setMediaFiles] = useState([]);
  const imageRef = useRef(null);
  const showToast = useShowToast();

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setMediaFiles((prev) => [...prev, ...files]);
      onOpen?.();
    }
  };

  const handleGifSelect = async (gifUrl) => {
    try {
      const res = await fetch(gifUrl);
      const blob = await res.blob();
      const file = new File([blob], "gif.gif", { type: "image/gif" });
      setMediaFiles((prev) => [...prev, file]);
      onOpen?.();
    } catch {
      showToast("Error", "Unable to load GIF", "error");
    }
  };

  const removeMediaAtIndex = (idx) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return {
    mediaFiles,
    setMediaFiles,
    imageRef,
    handleMediaChange,
    handleGifSelect,
    removeMediaAtIndex,
  };
}
