import { createContext, useContext, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useInitUserData from "./useInitUserData";
import useSocketSetup from "./useSocketSetup";

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);
const requestNotificationPermission = async () => {
  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("User denied notification permission");
    }
  }
};
export const SocketContextProvider = ({ children }) => {
  const socketRef = useRef(null);
  const user = useRecoilValue(userAtom);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useInitUserData(user);
  useSocketSetup(user, socketRef, setOnlineUsers);

  useEffect(() => {
    requestNotificationPermission();
  }, []);
  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

SocketContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
