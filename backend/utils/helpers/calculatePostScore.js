const calculatePostScore = (post) => {
  const likesScore = post.likes.length;
  const repostsScore = post.repostedBy.length * 2;
  const followersScore = post.postedBy.followers.length * 0.5;
  const hoursSincePost =
    (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
  const timeScore = hoursSincePost < 24 ? 2 : 0;

  return likesScore + repostsScore + followersScore + timeScore;
};

export default calculatePostScore;
