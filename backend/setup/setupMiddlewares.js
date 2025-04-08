import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";

export default function setupMiddlewares(app) {
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(
    cors({
      origin: "*",
      credentials: true,
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());
}
