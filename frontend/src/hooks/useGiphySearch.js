import { useEffect, useState } from "react";

const useGiphySearch = (searchTerm) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm) return;

    const fetchGifs = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=0MBQBqza3ebo1CrBj57DA7qnYRVaEO2O&q=${encodeURIComponent(
            searchTerm
          )}&limit=20&rating=pg&lang=en`
        );
        const data = await res.json();
        setResults(data.data);
      } catch (err) {
        console.error("Giphy API error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGifs();
  }, [searchTerm]);

  return { results, loading };
};

export default useGiphySearch;
