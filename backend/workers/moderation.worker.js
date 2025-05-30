import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import Post from "../models/postModel.js";
import { moderateMedia } from "../utils/moderate/moderateMediaWithSightengine.js";
import { moderateTextWithSightengine } from "../utils/moderate/moderateTextWithSightengine.js";
import { addNotificationJob } from "../queues/notification.producer.js";
import { io } from "../setup/setupServer.js";
import { getRecipientSocketId } from "../utils/socketUsers.js";
import { deleteMediaFiles } from "../utils/uploadUtils.js";
import { appendToCache } from "../utils/redisCache.js";

new Worker(
  "moderation-queue",
  async (job) => {
    const { postId, text, media, senderId, notification } = job.data;

    const post = await Post.findById(postId).populate(
      "postedBy",
      "_id username followers following"
    );
    if (!post) return;
    const recipientSocketId = getRecipientSocketId(senderId);
    // Kiểm duyệt text
    const textResult = await moderateTextWithSightengine(text);
    if (!textResult.ok) {
      await Post.findByIdAndDelete(postId);
      if (media.length > 0) await deleteMediaFiles(media);
      if (recipientSocketId) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        io.to(recipientSocketId).emit("post-rejected", postId);
      }
      await addNotificationJob({
        receivers: [senderId],
        type: "system",
        content: `We have removed your post.\nPost moderation failed: Text contains unsafe content.`,
      });

      return;
    }

    // Kiểm duyệt media
    if (media.length > 0) {
      for (const file of media) {
        if (
          file.type === "audio" ||
          file.type === "gif" ||
          file.type === "video"
        )
          continue;
        const moderation = await moderateMedia(file.url, file.type);

        if (!moderation.ok) {
          await deleteMediaFiles(media);
          await Post.findByIdAndDelete(postId);
          if (recipientSocketId) {
            await new Promise((resolve) => setTimeout(resolve, 300));
            io.to(recipientSocketId).emit("post-rejected", postId);
          }
          await addNotificationJob({
            receivers: [senderId],
            type: "system",
            content: `Post moderation failed: Media contains unsafe content`,
          });
          return;
        }
      }
    }
    // Nếu hợp lệ thì cập nhật post
    post.text = textResult.cleanedText || post.text;
    post.status = "approved";
    await post.save();
    const redisKey = `posts:${senderId}`;
    await appendToCache(redisKey, post._id);
    // Gửi thông báo nếu có cài đặt notification
    if (
      notification &&
      ["followers", "following", "all"].includes(notification)
    ) {
      let receivers = [];
      if (notification === "all") {
        receivers = [...post.postedBy.followers, ...post.postedBy.following];
      } else if (notification === "followers") {
        receivers = post.postedBy.followers;
      } else if (notification === "following") {
        receivers = post.postedBy.following;
      }

      if (receivers.length > 0) {
        await addNotificationJob({
          sender: senderId,
          receivers,
          type: "post",
          content: `@${post.postedBy.username} just posted a new post`,
          post: post._id,
        });
      }
    }
  },
  {
    connection: redisConnection,
  }
);
