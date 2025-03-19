import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import User from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, {
            message: "Không lấy được email từ Google.",
          });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
          if (existingUser.googleId) {
            return done(null, existingUser);
          }

          if (existingUser.facebookId) {
            console.log("⚠ Lỗi: Email đã được đăng ký bằng Facebook.");
            return done(null, false, {
              message: "Email đã được đăng ký bằng Facebook.",
            });
          }

          existingUser.googleId = profile.id;
          await existingUser.save();
          return done(null, existingUser);
        }

        const newUser = new User({
          googleId: profile.id,
          name: profile.displayName,
          email,
          profilePic: profile.photos?.[0]?.value || "",
          username: email.split("@")[0],
        });

        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        console.error("🔥 Google Strategy Error:", err);
        return done(err, false);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL:
        process.env.FACEBOOK_CALLBACK_URL ||
        "http://localhost:5000/api/auth/facebook/callback",
      profileFields: ["id", "displayName", "email", "photos"], // ✅ Lấy thêm email & ảnh
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value; // Một số tài khoản Facebook không có email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          if (existingUser.googleId) {
            // Nếu tài khoản đã đăng ký bằng Facebook trước đó
            return done(
              new Error("Email này đã được sử dụng để đăng nhập bằng Google."),
              null
            );
          }
          if (existingUser.facebookId) {
            return done(null, existingUser);
          }

          existingUser.facebookId = profile.id;
          await existingUser.save();
          return done(null, existingUser);
        }

        const newUser = new User({
          facebookId: profile.id,
          name: profile.displayName,
          email: email || `fb-${profile.id}@facebook.com`, // Nếu không có email
          profilePic: profile.photos?.[0]?.value || "",
          username: email ? email.split("@")[0] : `fb_${profile.id}`,
        });

        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
