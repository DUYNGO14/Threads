import express from "express";
import http from "http";
import { Server } from "socket.io";

import setupMiddlewares from "./setupMiddlewares.js";
import setupRoutes from "./setupRoutes.js";
import setupSession from "./setupSession.js";
import { setupErrorHandler } from "./setupErrorHandler.js";
import { getRecipientSocketId } from "../utils/socketUsers.js";
import { socketHandler } from "../sockets/socket.js";
import createDefaultAdmin from "../utils/createDefaultAdmin.js";
import "../workers/notificationWorker.js";
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5000",
      process.env.CLIENT_URL,
    ], // 👈 Render sẽ gọi từ tên miền khác
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Attach to app if needed elsewhere
app.set("io", io);

// Setup từng phần
createDefaultAdmin();
setupSession(app);
setupMiddlewares(app);
setupRoutes(app);
setupErrorHandler(app);
socketHandler(io); // xử lý socket ở đây

export { app, server, io, getRecipientSocketId };
