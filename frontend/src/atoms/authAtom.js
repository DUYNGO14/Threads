import { atom } from "recoil";

export const authScreenAtom = atom({
  key: "authScreenAtom",
  default: "login",
});

export const accessTokenAtom = atom({
  key: "accessTokenAtom",
  default: localStorage.getItem("access-token") || null,
});
