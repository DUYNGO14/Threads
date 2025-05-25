import redisClient from "../config/redis.config.js";

export const setRedis = async (key, data, ttl = 1800) => {
  const limitedData = Array.isArray(data) ? data.slice(0, 100) : data;
  await redisClient.set(key, JSON.stringify(limitedData), { ex: ttl });
};

export const getRedis = async (key) => {
  const cached = await redisClient.get(key);
  if (!cached) return null;

  if (typeof cached === "object") return cached;

  try {
    return JSON.parse(cached);
  } catch (err) {
    console.error("Redis parse error:", err);
    return null;
  }
};

export const deleteRedis = async (key) => {
  await redisClient.del(key);
};

export const appendToCache = async (redisKey, newData) => {
  const data = await getRedis(redisKey);

  if (!data) return;
  const updated = [newData, ...data];
  await setRedis(redisKey, updated);
};

export const removePostFromCache = async (redisKey, IdData) => {
  const data = await getRedis(redisKey);

  if (!Array.isArray(data)) return;

  // Xoá bài viết có postId tương ứng
  const updated = data.filter((pid) => pid.toString() !== IdData.toString());

  if (updated.length === 0) {
    await deleteRedis(redisKey);
  } else {
    await setRedis(redisKey, updated, 1800);
  }
};
