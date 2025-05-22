import Queue from "bullmq";
import { redisConnection } from "../config/redis.config";

const mediaQueue = new Queue("mediaQueue", {
  connection: redisConnection,
});

export default mediaQueue;
