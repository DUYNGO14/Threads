import multer from "multer";
import {
  ALLOWED_TYPES,
  MAX_FILE_SIZE_MB,
  MAX_FILES,
} from "../constants/upload.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: MAX_FILES,
  },
});

export const uploadMedia = upload.array("media", MAX_FILES);
