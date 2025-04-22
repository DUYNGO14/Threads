// services/moderateTextWithSightengine.js
import axios from "axios";
import dotenv from "dotenv";
import { moderateTextSmart } from "../moderateText.js";
dotenv.config();

export const moderateTextWithSightengine = async (text, options = {}) => {
  const { skipSightengine = false } = options;

  try {
    // Kiểm duyệt thủ công
    const { ok, message: manualMessage } = await moderateTextSmart(text);
    if (!ok) {
      return {
        ok: false,
        message: `Text moderation failed: ${manualMessage}`,
      };
    }

    // Nếu dev mode: bỏ qua gọi Sightengine
    if (skipSightengine) {
      return {
        ok: true,
        message: "Đã vượt kiểm duyệt thủ công (dev mode).",
      };
    }

    // Gọi Sightengine kiểm duyệt sâu
    const response = await axios.get(
      "https://api.sightengine.com/1.0/text/check.json",
      {
        params: {
          text,
          lang: "en",
          mode: "standard",
          api_user: process.env.SIGHTENGINE_API_USER,
          api_secret: process.env.SIGHTENGINE_API_SECRET,
        },
      }
    );

    const result = response.data;
    console.log("result", result);

    const relevantFlags = [
      "profanity",
      "personal_data",
      "link",
      "phone",
      "email",
    ];
    const flaggedCategories = relevantFlags.filter((key) => {
      const items = result[key];
      return items && Array.isArray(items) && items.length > 0;
    });

    if (flaggedCategories.length > 0) {
      return {
        ok: false,
        message: `Nội dung vi phạm: ${flaggedCategories.join(", ")}`,
        flagged: flaggedCategories,
      };
    }

    return {
      ok: true,
      message: "Nội dung văn bản an toàn.",
    };
  } catch (err) {
    console.error("❌ Lỗi kiểm duyệt văn bản (Sightengine):", err.message);
    if (err.response?.data) {
      console.error("Chi tiết lỗi:", err.response.data);
    }
    return {
      ok: false,
      message: "Không thể kiểm duyệt văn bản.",
    };
  }
};
