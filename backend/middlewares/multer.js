import multer from "multer";
import path from "path";
import {
  ALLOWED_TYPES,
  MAX_FILE_SIZE_MB,
  MAX_FILES,
} from "../constants/upload.js";

// Cấu hình lưu trữ tạm
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // nhớ tạo thư mục này hoặc dùng fs để kiểm tra tự tạo
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

// Lọc định dạng file
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
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, // kích thước mỗi file
    files: MAX_FILES, // tổng số file
  },
});

// Middleware xử lý nhiều file input field name là "media"
export const uploadMedia = upload.array("media", MAX_FILES);
