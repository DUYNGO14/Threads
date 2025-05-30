const SCORE_CONFIG = {
  FOLLOWED_USER: 5,
  INTERACTED_USER: 4,
  MATCHED_TAG: 3,
  MANY_LIKES: 2,
  MANY_REPOSTS: 2,
  RECENT_POST: 3,
};

export const scorePost = ({
  post,
  userFollowingSet,
  interactedUserSet,
  interactedTagsSet,
}) => {
  let score = 0;

  const posterId = post.postedBy?.toString();

  // +5 nếu follow người đăng
  if (userFollowingSet.has(posterId)) {
    score += SCORE_CONFIG.FOLLOWED_USER;
  }

  // +4 nếu từng tương tác với người đăng
  if (interactedUserSet.has(posterId)) {
    score += SCORE_CONFIG.INTERACTED_USER;
  }

  // +3 nếu tag trùng
  if (post.tags && typeof post.tags === "string") {
    for (const tag of post.tags.split(",")) {
      if (interactedTagsSet.has(tag.trim())) {
        score += SCORE_CONFIG.MATCHED_TAG;
        break;
      }
    }
  }

  // +2 nếu nhiều like
  if (post.likes?.length >= 20) {
    score += SCORE_CONFIG.MANY_LIKES;
  }

  // +2 nếu nhiều repost
  if (post.repostedBy?.length >= 10) {
    score += SCORE_CONFIG.MANY_REPOSTS;
  }

  // +3 nếu mới trong 6h gần nhất
  const ageHours =
    (Date.now() - new Date(post.createdAt).getTime()) / 1000 / 60 / 60;
  if (ageHours <= 6) {
    score += SCORE_CONFIG.RECENT_POST;
  }

  return score;
};
