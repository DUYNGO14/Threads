import { useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import { followingAtom } from "../atoms/followAtoms";
import useShowToast from "./useShowToast";
import userAtom from "../atoms/userAtom";
import api from "../services/api.js";

const useFollowUnfollow = (user, onSuccess) => {
  const currentUser = useRecoilValue(userAtom);
  const setFollowing = useSetRecoilState(followingAtom);
  const setCurrentUser = useSetRecoilState(userAtom);
  const navigate = useNavigate();
  const showToast = useShowToast();

  const isMyself = currentUser?._id === user._id;
  const following = currentUser?.following?.includes(user._id) || isMyself;
  const [updating, setUpdating] = useState(false);

  const handleFollowUnfollow = async () => {
    if (!currentUser) {
      showToast("Warning", "You need to login first", "warning");
      return navigate("/auth");
    }

    if (updating) return;
    const optimisticValue = !following;
    setUpdating(true);

    // Cập nhật UI trước (optimistic)
    setFollowing((prev) =>
      optimisticValue ? [...prev, user] : prev.filter((u) => u._id !== user._id)
    );
    setCurrentUser((prev) => ({
      ...prev,
      following: optimisticValue
        ? [...prev.following, user._id]
        : prev.following.filter((id) => id !== user._id),
    }));

    try {
      const res = await api.post(`/api/users/follow/${user._id}`, {});
      const data = res.data;

      if (data.error) {
        // Revert lại nếu lỗi
        setFollowing((prev) =>
          !optimisticValue
            ? [...prev, user]
            : prev.filter((u) => u._id !== user._id)
        );
        setCurrentUser((prev) => ({
          ...prev,
          following: !optimisticValue
            ? [...prev.following, user._id]
            : prev.following.filter((id) => id !== user._id),
        }));
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
      // Revert lại nếu lỗi
      setFollowing((prev) =>
        !optimisticValue
          ? [...prev, user]
          : prev.filter((u) => u._id !== user._id)
      );
      setCurrentUser((prev) => ({
        ...prev,
        following: !optimisticValue
          ? [...prev.following, user._id]
          : prev.following.filter((id) => id !== user._id),
      }));
      showToast("Error", err.message || "Something went wrong", "error");
    } finally {
      setUpdating(false);
    }
  };

  return { handleFollowUnfollow, updating, following };
};

export default useFollowUnfollow;
