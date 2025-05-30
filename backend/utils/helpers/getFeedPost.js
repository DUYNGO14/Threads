async function getTrendingPosts(limit = 50) {
  return Post.find({ status: "approved" })
    .sort({ likes: -1, repostedBy: -1, createdAt: -1 })
    .limit(limit)
    .lean();
}

async function getRecentPosts(limit = 50) {
  return Post.find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function generateGlobalFeed() {
  try {
    const trendingPosts = await getTrendingPosts(40);
    const recentPosts = await getRecentPosts(40);
    const map = new Map();
    [...trendingPosts, ...recentPosts].forEach((p) =>
      map.set(p._id.toString(), p)
    );
    const combinedPosts = Array.from(map.values());
    const redisKey = "feed:global:non_interactive_users";
    await redis.del(redisKey);
    if (combinedPosts.length > 0) {
      const postIds = combinedPosts.map((p) => p._id.toString());
      await redis.rpush(redisKey, ...postIds);
      await redis.expire(redisKey, 30 * 60);
    }
    console.log(`Generated global feed with ${combinedPosts.length} posts`);
  } catch (error) {
    console.error("Error generating global feed:", error);
  }
}
