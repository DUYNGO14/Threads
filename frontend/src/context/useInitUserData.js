import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import {
  conversationsAtom,
  unreadConversationsCountAtom,
} from "../atoms/messagesAtom";
import {
  unreadNotificationCountAtom,
  notificationAtom,
} from "../atoms/notificationAtom";

const useInitUserData = (user) => {
  const setConversations = useSetRecoilState(conversationsAtom);
  const setUnreadCount = useSetRecoilState(unreadConversationsCountAtom);
  const setNotification = useSetRecoilState(notificationAtom);
  const setUnreadNotificationCount = useSetRecoilState(
    unreadNotificationCountAtom
  );

  useEffect(() => {
    if (!user?._id) return;

    const fetchInitData = async () => {
      try {
        const [convRes, notiRes] = await Promise.all([
          fetch("/api/messages/conversations"),
          fetch("/api/notifications/"),
        ]);

        const [convData, notiData] = await Promise.all([
          convRes.json(),
          notiRes.json(),
        ]);

        if (!convData.error) {
          setConversations(convData);
          const unread = convData.filter((c) => c.unreadCount > 0).length;
          setUnreadCount(unread);
        }

        if (!notiData.error) {
          setNotification(notiData);
          console.log(notiData);
          const unreadNoti = notiData.filter((n) => !n.isRead).length;
          setUnreadNotificationCount(unreadNoti);
          console.log(unreadNoti);
        }
      } catch (err) {
        console.error("❌ Error fetching init data:", err.message);
      }
    };

    fetchInitData();
  }, [user?._id]);
};

export default useInitUserData;
