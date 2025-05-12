import { useEffect } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  conversationsAtom,
  selectedConversationAtom,
} from "../atoms/messagesAtom";
import { useSocket } from "../context/SocketContext";
import messageSound from "../assets/sounds/message.mp3";

const useMessageSocket = (setMessages) => {
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const setConversations = useSetRecoilState(conversationsAtom);
  const { socket } = useSocket();

  useEffect(() => {
    if (!selectedConversation?._id) return;
    socket.emit("joinRoom", selectedConversation._id);
    return () => socket.emit("leaveRoom", selectedConversation._id);
  }, [selectedConversation?._id]);

  useEffect(() => {
    const handleNewMessage = (message) => {
      if (selectedConversation._id === message.conversationId) {
        setMessages((prev) => [...prev, message]);
      }

      if (!document.hasFocus()) new Audio(messageSound).play();

      setConversations((prev) =>
        prev.map((c) =>
          c._id === message.conversationId
            ? {
                ...c,
                lastMessage: { text: message.text, sender: message.sender },
              }
            : c
        )
      );
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [selectedConversation._id]);
};

export default useMessageSocket;
