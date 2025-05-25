import { useCallback } from "react";
import { useRecoilState } from "recoil";
import { listUserAtom } from "../atoms/userAtom";
import useShowToast from "./useShowToast";
import api from "../services/api";

const useToggleBlockUser = () => {
  const [listUser, setListUser] = useRecoilState(listUserAtom);
  const showToast = useShowToast();

  const toggleBlockUser = useCallback(
    async (userId) => {
      try {
        const res = await api.put(`/api/admin/user/${userId}/block`);
        const updatedUser = res.data.data;
        const message = updatedUser.isBlocked
          ? "User blocked successfully"
          : "User unblocked successfully";
        showToast(message, "", "success");

        setListUser((prevUsers) =>
          prevUsers.map((user) =>
            user._id === updatedUser._id ? updatedUser : user
          )
        );
      } catch (error) {
        console.error("Error toggling block user:", error);
        showToast(
          "Error",
          error.response?.data?.message || error.message,
          "error"
        );
      }
    },
    [setListUser, showToast]
  );

  return toggleBlockUser;
};

export default useToggleBlockUser;
