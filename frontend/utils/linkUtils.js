export const extractUrls = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex) || [];

  return matches.map((url) => {
    const link = (
      <a
        href={url}
        style={{ color: "blue", textDecoration: "none" }}
        target="_blank"
        rel="noopener noreferrer"
      >
        {url}
      </a>
    );
    return link;
  });
};

export const isInternalPostLink = (url) => {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "myapp.com" && parsed.pathname.startsWith("/posts/")
    );
  } catch {
    return false;
  }
};

export const isInternalUserLink = (url) => {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "myapp.com" && parsed.pathname.startsWith("/users/")
    );
  } catch {
    return false;
  }
};

export const isExternalLink = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname !== "myapp.com";
  } catch {
    return false;
  }
};
