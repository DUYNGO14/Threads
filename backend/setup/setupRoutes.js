import authRoutes from "../routes/authRouters.js";
import userRoutes from "../routes/userRouters.js";
import postRoutes from "../routes/postRouters.js";
import messageRoutes from "../routes/messageRouters.js";
import repliesRoutes from "../routes/repliesRouters.js";
import conversationRoutes from "../routes/conversationRoutes.js";
import path from "path";
import express from "express";

const __dirname = path.resolve();

export default function setupRoutes(app) {
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/replies", repliesRoutes);
  app.use("/api/conversations", conversationRoutes);

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
  }
}
