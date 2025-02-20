import { useToast } from "@chakra-ui/react"; // Đảm bảo import từ đúng package
import { useCallback } from "react";

const useShowToast = () => {
  const toast = useToast();

  const showToast = useCallback(
    (title, description, status = "info") => {
      toast({
        title,
        description,
        status,
        duration: 3000,
        isClosable: true,
        position: "top", // Đặt vị trí hiển thị
      });
    },
    [toast]
  );

  return showToast;
};

export default useShowToast;
