import { useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import { followingAtom, followersAtom } from "../atoms/followAtoms";
import useShowToast from "./useShowToast";
import userAtom from "../atoms/userAtom";
import api from "../services/api.js";
const useFollowUnfollow = (user, onSuccess) => {
  const currentUser = useRecoilValue(userAtom);
  const setFollowers = useSetRecoilState(followersAtom);
  const setFollowing = useSetRecoilState(followingAtom);
  const navigate = useNavigate();
  const showToast = useShowToast();

  const [following, setFollowingLocal] = useState(
    user.followers?.includes(currentUser?._id) || false
  );
  const [updating, setUpdating] = useState(false);

  const handleFollowUnfollow = async () => {
    // 👉 Kiểm tra đăng nhập
    if (!currentUser) {
      showToast("Warning", "You need to login first", "warning");
      return navigate("/auth");
    }

    if (updating) return;

    const optimisticValue = !following;
    setFollowingLocal(optimisticValue);

    setFollowing(
      optimisticValue
        ? (prev) => [...prev, user]
        : (prev) => prev.filter((u) => u._id !== user._id)
    );

    try {
      const res = await api.post(`/api/users/follow/${user._id}`, {});
      const data = await res.data;
      if (data.error) {
        setFollowingLocal(!optimisticValue);
        setFollowing((prev) => prev.filter((u) => u._id !== user._id));
        showToast("Error", data.error, "error");
        return;
      }

      showToast(
        "Success",
        `${optimisticValue ? "Followed" : "Unfollowed"} ${user.name}`,
        "success"
      );

      if (onSuccess) onSuccess(optimisticValue);
    } catch (err) {
      setFollowingLocal(!optimisticValue);
      setFollowing((prev) => prev.filter((u) => u._id !== user._id));
      showToast("Error", err.message || "Something went wrong", "error");
    } finally {
      setUpdating(false);
    }
  };

  return { handleFollowUnfollow, updating, following };
};

export default useFollowUnfollow;
