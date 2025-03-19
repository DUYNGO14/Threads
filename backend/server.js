import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import userRouters from "./routes/userRoutes.js";
import postRouters from "./routes/postRouters.js";
import messageRouters from "./routes/messageRouters.js";
import authRouters from "./routes/authRouters.js";
import passport from "passport";
import session from "express-session";
import { v2 as cloudinary } from "cloudinary";
import "./config/passport.js";
import { server, app } from "./sockets/socket.js";
dotenv.config();
connectDB();

const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(express.json({ limit: "50mb" })); // to parse Json data in the req.body
app.use(express.urlencoded({ extended: true })); // to parse form data in the req.body
app.use(cookieParser());
// Cấu hình session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true },
  })
);
app.use(passport.initialize());
app.use(passport.session());
// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
//routers
app.use("/api/auth", authRouters);
app.use("/api/users", userRouters);
app.use("/api/posts", postRouters);
app.use("/api/messages", messageRouters);

// http://localhost:5000 => backend,frontend

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "/frontend/dist")));

//   // react app
//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
//   });
// }

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}!`);
});
