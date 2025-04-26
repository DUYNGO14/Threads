import { atom } from "recoil";

export const notificationAtom = atom({
  key: "notificationAtom",
  default: [],
});
export const unreadNotificationCountAtom = atom({
  key: "unreadNotificationCountAtom",
  default: 0,
});
