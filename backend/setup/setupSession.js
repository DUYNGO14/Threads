import session from "express-session";
import MongoStore from "connect-mongo";
import "../config/connectDB.config.js";
import "../config/passport.config.js";
export default function setupSession(app) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "secret",
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
}
