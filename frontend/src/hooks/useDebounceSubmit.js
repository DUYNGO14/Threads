import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const useDebounceSubmit = (submitFunction, delay = 500) => {
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSubmit = useDebouncedCallback(async (...args) => {
    try {
      setIsLoading(true);
      await submitFunction(...args);
    } finally {
      setIsLoading(false);
    }
  }, delay);

  return {
    handleSubmit: debouncedSubmit,
    isLoading,
  };
};

export default useDebounceSubmit;
