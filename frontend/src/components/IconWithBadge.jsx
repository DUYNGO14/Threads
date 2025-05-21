import { BsFillChatQuoteFill } from "react-icons/bs";
import { useRecoilValue } from "recoil";
import { unreadConversationsCountAtom } from "../atoms/messagesAtom";
import { Box } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { unreadNotificationCountAtom } from "../atoms/notificationAtom";
import { IoMdNotificationsOutline } from "react-icons/io";
export const ChatIconWithBadge = () => {
  const unreadCount = useRecoilValue(unreadConversationsCountAtom);
  const MotionBox = motion(Box);
  return (
    <Box position="relative">
      <BsFillChatQuoteFill size={24} />
      {unreadCount > 0 && (
        <MotionBox
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.4 }}
          position="absolute"
          top="-6px"
          right="-6px"
          bg="red.500"
          color="white"
          fontSize="xs"
          fontWeight="bold"
          borderRadius="full"
          px={1.5}
          minW="5"
          textAlign="center"
        >
          {unreadCount}
        </MotionBox>
      )}
    </Box>
  );
};

export const NotificationIconWithBadge = () => {
  const unreadCount = useRecoilValue(unreadNotificationCountAtom);
  const MotionBox = motion(Box);
  return (
    <Box position="relative">
      <IoMdNotificationsOutline size={24} />
      {unreadCount > 0 && (
        <MotionBox
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.4 }}
          position="absolute"
          top="-6px"
          right="-6px"
          bg="red.500"
          color="white"
          fontSize="xs"
          fontWeight="bold"
          borderRadius="full"
          px={1.5}
          minW="5"
          textAlign="center"
        >
          {unreadCount}
        </MotionBox>
      )}
    </Box>
  );
};


