import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import pLimit from "p-limit";

// Constants
import { MAX_FILE_SIZE_MB } from "../constants/upload.js";

// Upload một file đơn lẻ
const uploadFile = async (file) => {
  try {
    const { mimetype, originalname, size, path } = file;

    if (size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(
        `File ${originalname} exceeds size limit (${MAX_FILE_SIZE_MB}MB)`
      );
    }

    const [type] = mimetype.split("/");

    let resourceType = "raw";
    let fileType = "file";

    if (type === "image") {
      resourceType = "image";
      fileType = "image";
    } else if (type === "video") {
      resourceType = "video";
      fileType = "video";
    } else if (type === "audio") {
      resourceType = "video"; // Cloudinary xử lý audio như video
      fileType = "audio";
    } else if (type === "gif") {
      resourceType = "video";
      fileType = "gif";
    }

    const uploadedResponse = await cloudinary.uploader.upload(path, {
      resource_type: resourceType,
    });

    if (!uploadedResponse?.secure_url) {
      throw new Error("Upload failed (no secure_url)");
    }

    await fs.unlink(path); // Xoá file tạm
    return { url: uploadedResponse.secure_url, type: fileType };
  } catch (err) {
    console.error(`Upload error [${file.originalname}]:`, err.message);
    return null;
  }
};

// Upload nhiều file (có giới hạn song song)
export const uploadFiles = async (files) => {
  if (!files || files.length === 0) return [];

  const limit = pLimit(3); // Giới hạn 3 file upload song song

  const uploadPromises = files.map((file) => limit(() => uploadFile(file)));

  const uploadedFiles = await Promise.all(uploadPromises);
  return uploadedFiles.filter((f) => f !== null);
};
