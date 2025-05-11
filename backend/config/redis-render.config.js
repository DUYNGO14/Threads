// redis-render.ts
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisRender = new Redis(process.env.RENDER_REDIS_URL);

export default redisRender;
