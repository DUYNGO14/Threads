import { useState } from "react";

/**
 * Hook để quản lý trạng thái modal của Reply (Edit / Delete)
 */
const useReplyModalManager = () => {
  const [modalState, setModalState] = useState({ type: "", isOpen: false });

  const openModal = (type) => {
    setModalState({ type, isOpen: true });
  };

  const closeModal = () => {
    setModalState({ type: "", isOpen: false });
  };

  const isOpen = modalState.isOpen;
  const modalType = modalState.type;

  return { isOpen, modalType, openModal, closeModal };
};

export default useReplyModalManager;
