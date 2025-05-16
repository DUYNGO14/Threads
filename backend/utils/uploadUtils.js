import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import pLimit from "p-limit";
import sanitizeUsername from "./helpers/sanitizeUsername.js";
// Constants
import { MAX_FILE_SIZE_MB } from "../constants/upload.js";

// Upload một file đơn lẻ
const uploadFile = (file, username, nameFolder) => {
  return new Promise((resolve, reject) => {
    const { buffer, originalname, mimetype, size } = file;

    if (size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return reject(
        new Error(
          `File ${originalname} exceeds size limit (${MAX_FILE_SIZE_MB}MB)`
        )
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

    const safeUsername = sanitizeUsername(username);
    const folder = `${safeUsername}/${nameFolder}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder,
      },
      (error, result) => {
        if (error) {
          console.error(`Upload error [${originalname}]:`, error.message);
          return resolve(null);
        }

        if (!result?.secure_url) return resolve(null);

        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          type: fileType,
          width: result.width || null,
          height: result.height || null,
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Upload nhiều file (có giới hạn song song)
export const uploadFiles = async (files, username, nameFolder) => {
  if (!files || files.length === 0) return [];

  const limit = pLimit(3); // Giới hạn 3 file upload song song

  const uploadPromises = files.map((file) =>
    limit(() => uploadFile(file, username, nameFolder))
  );

  const uploadedFiles = await Promise.all(uploadPromises);
  return uploadedFiles.filter((f) => f !== null);
};
export const deleteMediaFiles = async (mediaList = []) => {
  if (!Array.isArray(mediaList) || mediaList.length === 0) return;

  const deletePromises = mediaList.map(async (media) => {
    try {
      let publicId = media.public_id;

      // Nếu không có sẵn public_id → trích từ URL
      if (!publicId && media.url) {
        const urlParts = media.url.split("/");
        const filePath = urlParts.slice(-3).join("/"); // folder/file.ext
        publicId = filePath.split(".")[0]; // remove extension
      }

      if (!publicId) {
        console.warn(
          "⚠️ Skipping media without valid public_id or url:",
          media
        );
        return;
      }

      const resourceType = ["video", "audio", "gif"].includes(media.type)
        ? "video"
        : "image";

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      if (result.result !== "ok") {
        console.warn(
          `⚠️ Cloudinary deletion not confirmed for ${publicId}:`,
          result
        );
      }
    } catch (error) {
      console.error(
        "❌ Error deleting media from Cloudinary:",
        error.message || error
      );
    }
  });

  await Promise.all(deletePromises);
};

export const extractPublicId = (url) => {
  if (!url) return null;

  const parts = url.split("/upload/");
  if (parts.length < 2) return null;

  let path = parts[1];

  // Loại bỏ version nếu có (v123456)
  const segments = path.split("/");
  if (/^v\d+$/.test(segments[0])) {
    segments.shift();
  }

  // Tách và loại bỏ đuôi file (.jpg, .png, .mp4...)
  const lastSegment = segments.pop();
  const publicId = lastSegment.split(".")[0];
  segments.push(publicId);

  return segments.join("/");
};

export const uploadProfilePic = async (newPic, oldPic = null, username) => {
  try {
    if (oldPic) {
      const publicId = extractPublicId(oldPic);
      if (publicId) {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: "image",
        });

        if (result.result !== "ok") {
          console.warn(`⚠️ Failed to delete old profile pic:`, result);
        }
      }
    }

    const safeUsername = sanitizeUsername(username);
    const uploadedResponse = await cloudinary.uploader.upload(newPic, {
      folder: `${safeUsername}/avatar`,
      resource_type: "image",
    });

    if (!uploadedResponse?.secure_url) {
      throw new Error("Upload failed (no secure_url)");
    }

    return uploadedResponse.secure_url;
  } catch (err) {
    console.error("❌ Error uploading profile picture:", err.message);
    return null;
  }
};
