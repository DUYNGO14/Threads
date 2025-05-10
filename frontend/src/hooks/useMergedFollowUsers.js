// hooks/useMergedFollowUsers.ts
import { useEffect, useState } from "react";
import api from "@/services/api";
import { useToast } from "@chakra-ui/react";

const useMergedFollowUsers = (username) => {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!username) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [resFollowers, resFollowing] = await Promise.all([
          api.get(`/api/users/${username}/followed`),
          api.get(`/api/users/${username}/following`),
        ]);
        setFollowers(resFollowers.data);
        setFollowing(resFollowing.data);
      } catch (error) {
        console.error("Error fetching follow data:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load follow data",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, toast]);

  // Merge + loại trùng theo username
  const mergedUsers = [...followers, ...following];
  const uniqueUsers = Array.from(
    new Set(mergedUsers.map((u) => u.username))
  ).map((username) => mergedUsers.find((u) => u.username === username));

  return { followers, following, mergedUsers: uniqueUsers, loading };
};

export default useMergedFollowUsers;
