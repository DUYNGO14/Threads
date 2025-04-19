import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";

const useAuthUser = () => {
  const setUser = useSetRecoilState(userAtom);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/user", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch user");

        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error("User fetch error:", error);
        setUser(null);
      }
    };

    fetchUser();
  }, []);
};

export default useAuthUser;
