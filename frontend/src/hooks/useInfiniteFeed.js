import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const LIMIT = 10;

export default function useInfiniteFeed() {
  const [feed, setFeed] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);

  const fetchFeed = useCallback(async () => {
    if (loading || !hasMore) return;
    try {
      setLoading(true);
      const res = await axios.get("/api/feed", {
        params: {
          limit: LIMIT,
          cursor: cursor || undefined,
        },
      });

      const newPosts = res.data.feed || [];
      setFeed((prev) => [...prev, ...newPosts]);
      setCursor(res.data.nextCursor);
      setHasMore(res.data.hasMore);
      setInitialLoad(false);
    } catch (err) {
      setError(err);
      setInitialLoad(false);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, hasMore]);

  useEffect(() => {
    fetchFeed(); // initial load
  }, []);

  return {
    feed,
    fetchMore: fetchFeed,
    hasMore,
    loading,
    initialLoad,
    error,
  };
}
