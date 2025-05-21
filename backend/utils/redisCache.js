import redisClient from "../config/redis.config.js";
// Lưu danh sách post (dạng JSON)
export const setRedis = async (key, data, ttl = 1800) => {
  // console.log("Setting Redis cache:", data);
  await redisClient.set(key, JSON.stringify(data), { ex: ttl });
};

// Lấy danh sách post từ cache
export const getRedis = async (key) => {
  const cached = await redisClient.get(key);
  if (!cached) return null;

  // Nếu cached là object, trả ngay mà không cần parse
  if (typeof cached === "object") return cached;

  // Nếu cached là string, tiến hành parse
  try {
    return JSON.parse(cached);
  } catch (err) {
    console.error("Redis parse error:", err);
    return null;
  }
};

// Xóa cache
export const deleteRedis = async (key) => {
  await redisClient.del(key);
};

// Thêm post vào đầu cache (nếu tồn tại)
export const appendToCache = async (redisKey, newData) => {
  const data = await getRedis(redisKey); // Lấy dữ liệu từ cache

  if (!data) return; // Nếu cache không tồn tại, bỏ qua

  const updated = [newData, ...data]; // Thêm bài viết mới vào đầu danh sách
  await setRedis(redisKey, updated); // Lưu lại vào cache
};

// Xoá post khỏi cache theo postId
export const removePostFromCache = async (redisKey, IdData) => {
  const data = await getRedis(redisKey); // Lấy dữ liệu từ cache

  if (!Array.isArray(data)) return; // Nếu cache không tồn tại hoặc không phải mảng → bỏ qua

  // Xoá bài viết có postId tương ứng
  const updated = data.filter((pid) => pid.toString() !== IdData.toString());

  if (updated.length === 0) {
    await deleteRedis(redisKey); // Nếu không còn bài nào → xoá key luôn
  } else {
    await setRedis(redisKey, updated, 1800); // Ghi lại cache với TTL 30 phút (nếu setRedis hỗ trợ TTL)
  }
};
