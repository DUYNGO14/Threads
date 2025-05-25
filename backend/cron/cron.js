import cron from "cron";
import https from "https";
import User from "../models/userModel.js";
import connectDB from "../config/connectDB.config.js";

connectDB();

const URL = "https://threads-0m08.onrender.com";

const deleteUnverifiedUsers = async () => {
  try {
    console.log("🔄 Bắt đầu xoá tài khoản chưa xác thực...");

    const expirationTime = new Date();
    expirationTime.setDate(expirationTime.getDate() - 7);

    const result = await User.deleteMany({
      isVerified: false,
      createdAt: { $lt: expirationTime },
    });

    console.log(`✅ Đã xoá ${result.deletedCount} tài khoản chưa xác thực`);
  } catch (error) {
    console.error("❌ Lỗi khi xoá người dùng chưa xác thực:", error);
  }
};
const refreshAllFeeds = async () => {
  try {
    console.log("🔁 Refreshing feeds...");
    const users = await User.find({ isFrozen: false, isBlocked: false }).select(
      "_id"
    );
    for (const user of users) {
      await generateFeedForUser(user._id);
      console.log(`✅ Feed refreshed for ${user._id}`);
    }
  } catch (err) {
    console.error("❌ Error refreshing feeds:", err);
  }
};
const job = new cron.CronJob("*/14 * * * *", function () {
  https
    .get(URL, (res) => {
      console.log(
        res.statusCode === 200
          ? "✅ GET request sent successfully"
          : `❌ GET request failed: ${res.statusCode}`
      );
    })
    .on("error", (e) => {
      console.error("❌ Error while sending request", e);
    });
});
const feedRefreshJob = new cron.CronJob("*/30 * * * *", refreshAllFeeds);
const deleteUsersJob = new cron.CronJob("0 0 * * *", deleteUnverifiedUsers);

// 🔥 **BẮT ĐẦU CRON JOBS**
job.start();
deleteUsersJob.start();
feedRefreshJob.start();

console.log("🚀 Cron jobs đã khởi động!");
console.log("🚀 Delete unverified users cron job started");
console.log("🚀 Feed cron job started");

export { job, deleteUsersJob, feedRefreshJob };
