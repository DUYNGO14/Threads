import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

async function createDefaultAdmin() {
  const adminExists = await User.findOne({ role: "admin" });
  if (!adminExists) {
    const password = "admin123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const admin = new User({
      name: "Admin",
      username: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
    });
    await admin.save();
    console.log("✅ Default admin created.");
  } else {
    console.log("ℹ️ Admin already exists.");
  }
}

export default createDefaultAdmin;
