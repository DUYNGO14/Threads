// middlewares/logRedisAuto.js
const logRedisAuto = (redis) => async (req, res, next) => {
  const userId = req.user?._id || req.params.userId || req.body.userId;
  if (!userId) return next();

  const cacheKey = `suggestions:${userId}`;
  try {
    const data = await redis.get(cacheKey);
    if (data) {
      console.log(`\n[Redis Log] Key: ${cacheKey}`);
      console.log(`Cached Data:\n`, data);
    } else {
      console.log(`\n[Redis Log] No cache for key: ${cacheKey}`);
    }
  } catch (err) {
    console.error(`[Redis Log] Error logging Redis key:`, err);
  }
  next();
};

export default logRedisAuto;
