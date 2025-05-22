import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import Post from "../models/postModel.js";

const interactionsWorker = new Worker(
  "user-interactions",
  async (job) => {
    const { userId, postId, actionType } = job.data;

    const post = await Post.findById(postId).select("postedBy tags").lean();
    if (!post) throw new Error("Post not found");

    const interaction = {
      postId,
      type: actionType,
      interactedAt: new Date().toISOString(),
      postOwner: post.postedBy.toString(),
      postTags: post.tags || [],
    };

    const redisKey = `user:${userId}:recentInteractions`;
    await redisConnection.lPush(redisKey, JSON.stringify(interaction));
    await redisConnection.lTrim(redisKey, 0, 49);
    await redisConnection.expire(redisKey, 60 * 60 * 24 * 1);
  },
  { connection: redisConnection }
);

interactionsWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

interactionsWorker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
});
