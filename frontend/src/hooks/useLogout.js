import userAtom from "../atoms/userAtom";
import { useSetRecoilState } from "recoil";
import useShowToast from "./useShowToast";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const useLogout = () => {
  const setUser = useSetRecoilState(userAtom);
  const showToast = useShowToast();
  const navigate = useNavigate();

  const logout = async () => {
    try {
      const res = await api.post("/api/auth/logout", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.data;

      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      localStorage.removeItem("user-threads");
      localStorage.removeItem("access-token");
      setUser(null);
      showToast("Success", "Logout successful", "success");
      navigate("/auth");
    } catch (error) {
      showToast("Error", error?.message || "Something went wrong", "error");
    }
  };

  return logout;
};

export default useLogout;
