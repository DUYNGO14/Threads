import mongoose from "mongoose"; // Import mongoose
import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouters from "./routes/userRoutes.js";
import postRouters from "./routes/postRouters.js";
import messageRouters from "./routes/messageRouters.js";
import authRouters from "./routes/authRouters.js";
import passport from "passport";
import session from "express-session";
import MongoStore from "connect-mongo"; // Đảm bảo bạn đã import MongoStore
import connectDB from "./config/connectDB.config.js";
import { server, app } from "./sockets/socket.js";
import "./config/cloudinary.config.js";

dotenv.config();
connectDB();

const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

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

// Cấu hình session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key", // Sử dụng biến môi trường để bảo mật
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // Cung cấp URL MongoDB ở đây
      ttl: 14 * 24 * 60 * 60, // Thời gian sống của session (14 ngày)
    }), // Sử dụng mongoose.connection
    cookie: {
      secure: process.env.NODE_ENV === "production", // Đảm bảo chỉ sử dụng HTTPS khi ở môi trường production
    },
  })
);

// Routers
app.use("/api/auth", authRouters);
app.use("/api/users", userRouters);
app.use("/api/posts", postRouters);
app.use("/api/messages", messageRouters);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}!`);
});
