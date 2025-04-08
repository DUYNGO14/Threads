import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouters from "./routes/userRoutes.js";
import postRouters from "./routes/postRouters.js";
import messageRouters from "./routes/messageRouters.js";
import authRouters from "./routes/authRouters.js";
import repliesRouters from "./routes/repliesRouters.js";
import passport from "passport";
import session from "express-session";
import MongoStore from "connect-mongo";
import { server, app } from "./sockets/socket.js";
import connectDB from "./config/connectDB.config.js";

import "./config/cloudinary.config.js";
import "./config/passport.config.js";

dotenv.config();
connectDB();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 14 * 24 * 60 * 60,
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// Cấu hình các middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

// CORS
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Routers
app.use("/api/auth", authRouters);
app.use("/api/users", userRouters);
app.use("/api/posts", postRouters);
app.use("/api/messages", messageRouters);
app.use("/api/replies", repliesRouters);
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

server
  .listen(PORT, () => {
    console.log(`Server started on port ${PORT}!`);
  })
  .on("error", (err) => {
    console.error("Error starting server:", err);
  });
