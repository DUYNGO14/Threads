const MAX_CHAR = 500;
const MAX_FILES = 20;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg", // ✅ Hỗ trợ file .mp3
  "audio/wav", // ✅ Hỗ trợ file .wav
  "audio/ogg", // ✅ Hỗ trợ file .ogg
];

export { MAX_CHAR, MAX_FILES, ALLOWED_TYPES };
