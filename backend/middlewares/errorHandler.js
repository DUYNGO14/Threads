// middlewares/errorHandler.js
import multer from "multer";
import { MAX_FILE_SIZE_MB, MAX_FILES } from "../constants/upload.js";

// Middleware xử lý lỗi 404
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware xử lý lỗi tổng quát
export const errorHandler = (err, req, res, next) => {
  // Nếu là lỗi từ Multer (upload)
  if (err instanceof multer.MulterError) {
    let message = "Upload error";

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = `File quá lớn (tối đa ${MAX_FILE_SIZE_MB}MB)`;
        break;
      case "LIMIT_FILE_COUNT":
        message = `Chỉ được upload tối đa ${MAX_FILES} file`;
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = `File không hợp lệ hoặc sai định dạng`;
        break;
      default:
        message = err.message || message;
    }

    return res.status(400).json({ error: message });
  }

  // Lỗi thường
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
