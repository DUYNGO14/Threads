import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
export const moderateMedia = async (url, mediaType = "image") => {
  try {
    const response = await axios.get(
      "https://api.sightengine.com/1.0/check.json",
      {
        params: {
          url,
          models:
            "nudity-2.1,weapon,gore-2.0,recreational_drug,offensive,text-content,face-attributes,self-harm,gambling",
          api_user: process.env.SIGHTENGINE_API_USER,
          api_secret: process.env.SIGHTENGINE_API_SECRET,
        },
      }
    );

    const data = response.data;
    const issues = [];

    if (data.nudity?.raw >= 0.7) issues.push("nudity"); //khỏa thân
    if (data.weapon >= 0.7) issues.push("weapon"); //vũ khí
    if (data.gore?.prob >= 0.7) issues.push("gore"); //máu me, bạo lực
    if (data.recreational_drug >= 0.7) issues.push("drugs"); //chất kích thích, ma túy
    if (data.self_harm?.prob >= 0.7) issues.push("self-harm"); //hành vi tự hại, tự tử
    if (data.gambling >= 0.7) issues.push("gambling"); //cờ bạc

    const isSafe = issues.length === 0;

    return {
      ok: isSafe,
      message: isSafe
        ? `${mediaType} is safe`
        : `${mediaType} contains: ${issues.join(", ")}`,
      issues,
    };
  } catch (error) {
    console.error(
      `Sightengine error (${mediaType}):`,
      error.response?.data || error.message
    );
    return {
      ok: false,
      message: `${mediaType} moderation failed`,
      issues: [],
    };
  }
};
