import { useEffect, useState } from "react";
import api from "@services/api"; // thay đường dẫn nếu cần
import useShowToat from "@hooks/useShowToast";

export const useUserSearch = (debouncedSearchQuery) => {
  const [searchResults, setSearchResults] = useState([]);
  const toast = useShowToat();

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await api.get(
          `/api/users/search?query=${debouncedSearchQuery}`
        );
        if (Array.isArray(res.data)) {
          setSearchResults(res.data);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        toast("Error", error.message, "error");
      }
    };

    fetchSearchResults();
  }, [debouncedSearchQuery, toast]);

  return searchResults;
};
