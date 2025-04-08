import { createContext, useContext, useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import io from "socket.io-client";
import userAtom from "../atoms/userAtom";
import PropTypes from 'prop-types';

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const user = useRecoilValue(userAtom);

  useEffect(() => {
    if (!user?._id) return;

    const BACKEND_URL = import.meta.env.PROD
      ? "https://threads-0m08.onrender.com"
      : "http://localhost:5000";

    const newSocket = io(BACKEND_URL, {
      transports: ["websocket"], // 👈 ép dùng websocket để tránh polling
      query: { userId: user._id },
      withCredentials: true, // nếu có cookie/session
    });

    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => newSocket.disconnect();
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

SocketContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
