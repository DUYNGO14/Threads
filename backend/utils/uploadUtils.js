import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import {
  audioFormats,
  imageFormats,
  videoFormats,
} from "../constants/upload.js";

export const uploadFiles = async (files) => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map(async (file) => {
    try {
      const mimetype = file.mimetype;
      const extension = file.originalname.split(".").pop().toLowerCase();

      let resourceType = "raw"; // Default if not image/video/audio
      let fileType = "file"; // Return file type

      if (imageFormats.includes(extension)) {
        resourceType = "image";
        fileType = "image";
      } else if (videoFormats.includes(extension)) {
        resourceType = "video";
        fileType = "video";
      } else if (audioFormats.includes(extension)) {
        resourceType = "video";
        fileType = "audio";
      }

      // Upload to Cloudinary
      const uploadedResponse = await cloudinary.uploader.upload(file.path, {
        resource_type: resourceType,
      });

      if (!uploadedResponse || !uploadedResponse.secure_url) {
        throw new Error("Upload failed");
      }

      // Delete temporary file after successful upload
      await fs.unlink(file.path);

      return { url: uploadedResponse.secure_url, type: fileType };
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  });

  return (await Promise.all(uploadPromises)).filter((file) => file !== null);
};
