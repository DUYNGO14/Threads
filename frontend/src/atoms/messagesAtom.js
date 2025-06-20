import { atom } from "recoil";

export const conversationsAtom = atom({
  key: "conversationsAtom",
  default: [],
});

export const selectedConversationAtom = atom({
  key: "selectedConversationAtom",
  default: {
    _id: "",
    userId: "",
    username: "",
    userProfilePic: "",
  },
});
export const unreadConversationsCountAtom = atom({
  key: "unreadConversationsCount",
  default: 0,
});

export const messagesAtom = atom({
  key: "messagesAtom",
  default: [],
});
