const detectAndFormatLinks = (text) => {
  const socialMediaRegex =
    /https?:\/\/(?:www\.)?(facebook|twitter|tiktok|instagram)\.com\/[^\s]+/g;

  return text.replace(socialMediaRegex, (url) => {
    const platform = url.includes("facebook")
      ? "Facebook"
      : url.includes("twitter")
      ? "Twitter"
      : url.includes("tiktok")
      ? "TikTok"
      : url.includes("instagram")
      ? "Instagram"
      : "Social Media";

    return url;
  });
};
export default detectAndFormatLinks;
