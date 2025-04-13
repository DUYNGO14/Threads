const userSocketMap = {}; // { userId: socketId }

export const setUserSocket = (userId, socketId) => {
  userSocketMap[userId] = socketId;
};

export const removeUserSocket = (userId) => {
  delete userSocketMap[userId];
};

export const getRecipientSocketId = (recipientId) => {
  return userSocketMap[recipientId];
};

export const getOnlineUsers = () => {
  return Object.keys(userSocketMap);
};
