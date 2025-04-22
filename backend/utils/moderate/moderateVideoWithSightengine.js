import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const requestVideoModeration = async (url) => {
  try {
    const response = await axios.post(
      "https://api.sightengine.com/1.0/video/check.json",
      null,
      {
        params: {
          api_user: process.env.SIGHTENGINE_API_USER,
          api_secret: process.env.SIGHTENGINE_API_SECRET,
          url,
          models:
            "nudity-2.1,weapon,gore-2.0,recreational_drug,self-harm,gambling",
        },
      }
    );

    const { request } = response.data;

    return {
      ok: true,
      message: "Moderation started",
      requestId: request.id,
      status: request.status,
    };
  } catch (error) {
    console.error(
      "Sightengine requestVideoModeration error:",
      error.response?.data || error.message
    );
    return {
      ok: false,
      message: "Failed to start video moderation",
      requestId: null,
    };
  }
};

export const checkVideoModerationResult = async (requestId) => {
  try {
    const response = await axios.get(
      "https://api.sightengine.com/1.0/video/status.json",
      {
        params: {
          api_user: process.env.SIGHTENGINE_API_USER,
          api_secret: process.env.SIGHTENGINE_API_SECRET,
          request_id: requestId,
        },
      }
    );

    const data = response.data;

    if (data.status !== "finished") {
      return {
        ok: false,
        status: data.status,
        message: "Processing not finished yet",
        issues: [],
      };
    }

    const issues = [];

    if (Array.isArray(data.frames)) {
      for (const frame of data.frames) {
        if (frame.nudity?.raw >= 0.7) issues.push("nudity");
        if (frame.weapon >= 0.7) issues.push("weapon");
        if (frame.gore?.prob >= 0.7) issues.push("gore");
        if (frame.recreational_drug >= 0.7) issues.push("drugs");
        if (frame.self_harm?.prob >= 0.7) issues.push("self-harm");
        if (frame.gambling >= 0.7) issues.push("gambling");
      }
    }

    const uniqueIssues = [...new Set(issues)];
    const isSafe = uniqueIssues.length === 0;

    return {
      ok: true,
      status: data.status,
      isSafe,
      message: isSafe
        ? "Video is safe"
        : `Video contains: ${uniqueIssues.join(", ")}`,
      issues: uniqueIssues,
    };
  } catch (error) {
    console.error(
      "Sightengine checkVideoModerationResult error:",
      error.response?.data || error.message
    );
    return {
      ok: false,
      message: "Failed to check video moderation result",
      issues: [],
    };
  }
};
