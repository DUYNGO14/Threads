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
import api from "../services/api.js";
const useInitUserData = (user) => {
  const setConversations = useSetRecoilState(conversationsAtom);
  const setUnreadCount = useSetRecoilState(unreadConversationsCountAtom);
  const setNotification = useSetRecoilState(notificationAtom);
  const setUnreadNotificationCount = useSetRecoilState(
    unreadNotificationCountAtom
  );

  useEffect(() => {
    const accessToken = localStorage.getItem("access-token");
    if (!user?._id || !accessToken) return; // Không fetch nếu chưa có token

    const fetchInitData = async () => {
      try {
        const [convRes, notiRes] = await Promise.all([
          api.get("/api/conversations/"),
          api.get("/api/notifications/"),
        ]);

        const [convData, notiData] = await Promise.all([
          convRes.data,
          notiRes.data,
        ]);

        if (!convData.error) {
          setConversations(convData);
          const unread = convData.filter((c) => c.unreadCount > 0).length;
          setUnreadCount(unread);
        }

        if (!notiData.error) {
          setNotification(notiData);
          const unreadNoti = notiData.filter((n) => !n.isRead).length;
          setUnreadNotificationCount(unreadNoti);
        }
      } catch (err) {
        console.error("❌ Error fetching init data:", err.message);
      }
    };

    fetchInitData();
  }, [user?._id]);
};

export default useInitUserData;
