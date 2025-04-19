import { atom } from "recoil";

export const followersAtom = atom({
  key: "followersAtom",
  default: [],
});

export const followingAtom = atom({
  key: "followingAtom",
  default: [],
});
