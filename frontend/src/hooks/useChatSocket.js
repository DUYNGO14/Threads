// hooks/useChatSocket.js
import { useEffect } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  conversationsAtom,
  messagesAtom,
  selectedConversationAtom,
} from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { useSocket } from "@context/SocketContext";
import useShowToast from "@hooks/useShowToast";

const useChatSocket = () => {
  const { socket } = useSocket();
  const [conversations, setConversations] = useRecoilState(conversationsAtom);
  const [selectedConversation, setSelectedConversation] = useRecoilState(
    selectedConversationAtom
  );
  const [messages, setMessages] = useRecoilState(messagesAtom);
  const [currentUser] = useRecoilState(userAtom);
  const showToast = useShowToast();

  useEffect(() => {
    if (!socket) return;

    const handleMessagesSeen = ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation._id === conversationId
            ? {
                ...conversation,
                lastMessage: conversation.lastMessage
                  ? { ...conversation.lastMessage, seen: true }
                  : conversation.lastMessage,
              }
            : conversation
        )
      );
    };

    const handleNewGroup = (newGroup) => {
      setConversations((prev) => [newGroup, ...prev]);
    };

    const handleAddUserToGroup = ({ conversation, sender }) => {
      setConversations((prev) => [conversation, ...prev]);
      showToast(
        "Success",
        `${sender.username} has been added to the group ${conversation.groupName}.`,
        "success"
      );
    };

    const handleKickUser = ({ conversationId, userIdToRemove }) => {
      if (userIdToRemove === currentUser._id) {
        showToast("Info", "You have been kicked from this group.", "info");
        setConversations((prev) =>
          prev.filter((c) => c._id !== conversationId)
        );
        if (selectedConversation._id === conversationId) {
          setSelectedConversation({});
        }
      }
    };

    const handleUpdateUnreadCounts = ({ map }) => {
      if (!map || typeof map !== "object") return;
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          unreadCount: map[c._id] || 0,
        }))
      );
    };

    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("newGroup", handleNewGroup);
    socket.on("kickUser", handleKickUser);
    socket.on("addUserToGroup", handleAddUserToGroup);
    socket.on("updateUnreadCounts", handleUpdateUnreadCounts);

    return () => {
      socket.off("messagesSeen", handleMessagesSeen);
      socket.off("newGroup", handleNewGroup);
      socket.off("kickUser", handleKickUser);
      socket.off("addUserToGroup", handleAddUserToGroup);
      socket.off("updateUnreadCounts", handleUpdateUnreadCounts);
    };
  }, [socket, currentUser._id, selectedConversation._id]);
};
const useMarkSeen = (messages) => {
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const currentUser = useRecoilValue(userAtom);
  const { socket } = useSocket();

  useEffect(() => {
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];

    // Chỉ mark là seen nếu last message do người kia gửi
    if (lastMessage.sender === selectedConversation.userId) {
      socket.emit("markMessagesAsSeen", {
        conversationId: selectedConversation._id,
        userId: currentUser._id, // chính là người đang seen
      });
    }
  }, [messages, selectedConversation, currentUser, socket]);
};

export { useMarkSeen, useChatSocket };
