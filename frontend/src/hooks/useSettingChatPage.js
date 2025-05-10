import { useEffect, useState } from "react";
import api from "@services/api";
import { useRecoilState } from "recoil";
import {
  conversationsAtom,
  selectedConversationAtom,
} from "../atoms/messagesAtom";

const useSettingChatPage = () => {
  const [conversations, setConversations] = useRecoilState(conversationsAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useRecoilState(
    selectedConversationAtom
  );
  const onUpdateDeleteConversation = (conversationId) => {
    setConversations((prev) => prev.filter((c) => c._id !== conversationId));
    if (selectedConversation?._id === conversationId) {
      setSelectedConversation({});
    }
  };
  const handleDeleteGroup = async (conversation) => {
    try {
      setLoading(true);
      const res = await api.delete(
        `/api/conversations/group/${conversation._id}`
      );
      return res;
    } catch (error) {
      const errorData = error.response?.data?.error || error.message;
      setError(errorData);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembersToGroup = async (conversation, newMembersIds) => {
    try {
      setLoading(true);
      const res = await api.put(
        `/api/conversations/group/add-member/${conversation._id}`,
        { newMembersIds: newMembersIds }
      );
      return res;
    } catch (error) {
      const errorData = error.response?.data?.error || error.message;
      setError(errorData);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMembersFromGroup = async (conversation, membersIds) => {
    try {
      setLoading(true);
      const res = await api.put(
        `/api/conversations/group/remove-member/${conversation._id}`,
        { userIdToRemove: membersIds }
      );
      console.log(res);
      return res;
    } catch (error) {
      const errorData = error.response?.data?.error || error.message;
      setError(errorData);
    } finally {
      setLoading(false);
    }
  };
  const handleLeaveGroup = async (conversation) => {
    try {
      setLoading(true);
      const res = await api.put(
        `/api/conversations/group/leave/${conversation._id}`
      );
      console.log(res);
      return res;
    } catch (error) {
      const errorData = error.response?.data?.error || error.message;
      setError(errorData);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversation) => {
    try {
      setLoading(true);
      const res = await api.delete(
        `/api/conversations/delete/${conversation._id}`
      );
      return res;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleDeleteGroup,
    handleLeaveGroup,
    handleAddMembersToGroup,
    handleRemoveMembersFromGroup,
    handleDeleteConversation,
    onUpdateDeleteConversation,
  };
};

export default useSettingChatPage;
