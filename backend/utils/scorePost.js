function scorePost(post, user) {
  const weights = {
    following: 15,
    like: 1.5,
    repost: 3,
    reply: 2,
    tagMatch: 10,
    mediaRich: 4,
    freshness: 10,
    interactionWithOwner: 12,
    interactionWithTag: 8,
    alreadyInteractedPenalty: -20,
  };

  let score = 0;
  const followingIds = user.following.map((id) => id.toString());

  // 1. Theo dõi
  if (followingIds.includes(post.postedBy.toString())) {
    score += weights.following;
  }

  // 2. Cộng điểm theo lượng like/repost/reply
  score += weights.like * Math.log(1 + post.likes.length);
  score += weights.repost * post.repostedBy.length;
  score += weights.reply * post.replies.length;

  // 3. Matching tags với bio
  if (post.tags && user.bio) {
    const bioLower = user.bio.toLowerCase();
    const matched = post.tags.some((tag) =>
      bioLower.includes(tag.toLowerCase())
    );
    if (matched) score += weights.tagMatch;
  }

  // 4. Bài nhiều media (ảnh/video)
  if (post.media?.length >= 3) {
    score += weights.mediaRich;
  }

  // 5. Freshness (giảm dần theo thời gian)
  const hoursOld = (Date.now() - new Date(post.createdAt)) / (1000 * 60 * 60);
  score += Math.max(0, weights.freshness - hoursOld / 3);

  // 6. Cá nhân hóa theo recentInteractions
  const interactions = user.recentInteractions || [];

  // a) Ưu tiên người từng tương tác nhiều
  const interactedUserFreq = {};
  const interactedTagFreq = {};
  const interactedPostIds = new Set();

  for (const inter of interactions) {
    if (inter.postOwner) {
      interactedUserFreq[inter.postOwner] =
        (interactedUserFreq[inter.postOwner] || 0) + 1;
    }

    if (inter.postTags && Array.isArray(inter.postTags)) {
      for (const tag of inter.postTags) {
        interactedTagFreq[tag] = (interactedTagFreq[tag] || 0) + 1;
      }
    }

    if (inter.postId) {
      interactedPostIds.add(inter.postId.toString());
    }
  }

  const ownerId = post.postedBy.toString();
  if (interactedUserFreq[ownerId]) {
    score += weights.interactionWithOwner * interactedUserFreq[ownerId];
  }

  // b) Ưu tiên các tag người dùng hay tương tác
  if (post.tags) {
    for (const tag of post.tags) {
      if (interactedTagFreq[tag]) {
        score += weights.interactionWithTag * interactedTagFreq[tag];
      }
    }
  }

  // c) Trừ điểm nếu đã tương tác bài này rồi
  if (interactedPostIds.has(post._id.toString())) {
    score += weights.alreadyInteractedPenalty;
  }

  return score;
}

export default scorePost;
