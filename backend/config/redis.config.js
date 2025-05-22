import { Redis } from "@upstash/redis";
import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const redisConnection = new IORedis({
  host: process.env.UPSTASH_REDIS_HOST,
  port: process.env.UPSTASH_REDIS_PORT,
  password: process.env.UPSTASH_REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  tls: {}, // dùng TLS vì Upstash dùng HTTPS
});

export default redis;
