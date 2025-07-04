import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";

export default function setupMiddlewares(app) {
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(
    cors({
      origin: [process.env.CLIENT_URL, "http://localhost:3000"],
      credentials: true,
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());
}
