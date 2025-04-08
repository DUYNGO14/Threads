import express from "express";
import http from "http";
import { Server } from "socket.io";

import setupMiddlewares from "./setupMiddlewares.js";
import setupRoutes from "./setupRoutes.js";
import setupSession from "./setupSession.js";
import { setupErrorHandler } from "./setupErrorHandler.js";

import { socketHandler, getRecipientSocketId } from "../sockets/socket.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 👈 Render sẽ gọi từ tên miền khác
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Attach to app if needed elsewhere
app.set("io", io);

// Setup từng phần
setupSession(app);
setupMiddlewares(app);
setupRoutes(app);
setupErrorHandler(app);
socketHandler(io); // xử lý socket ở đây

export { app, server, io, getRecipientSocketId };
