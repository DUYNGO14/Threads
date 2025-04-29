import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import api from "../services/api.js";
const useAuthUser = () => {
  const setUser = useSetRecoilState(userAtom);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/user", {
          withCredentials: true,
        });

        const data = res.data;
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
