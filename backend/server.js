import dotenv from "dotenv";
dotenv.config();

import { app, server } from "./setup/setupServer.js";
import connectDB from "./config/connectDB.config.js";
import "./config/passport.config.js";
import "./config/cloudinary.config.js";
const PORT = process.env.PORT || 5000;

connectDB();

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Server running  bull dashboards: ${PORT}/admin/queues/`);
});
