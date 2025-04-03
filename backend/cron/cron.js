import cron from "cron";
import https from "https";
import User from "../models/userModel.js";
import connectDB from "../config/connectDB.config.js";

connectDB(); // Kết nối database

const URL = "https://threads-0m08.onrender.com";

// 🔹 Hàm xoá người dùng chưa xác thực
const deleteUnverifiedUsers = async () => {
  try {
    console.log("🔄 Bắt đầu xoá tài khoản chưa xác thực...");

    const expirationTime = new Date();
    expirationTime.setDate(expirationTime.getDate() - 7); // 7 ngày trước

    const result = await User.deleteMany({
      isVerified: false,
      createdAt: { $lt: expirationTime }, // Chỉ xoá người dùng đăng ký hơn 7 ngày trước
    });

    console.log(`✅ Đã xoá ${result.deletedCount} tài khoản chưa xác thực`);
  } catch (error) {
    console.error("❌ Lỗi khi xoá người dùng chưa xác thực:", error);
  }
};

// 🔹 Cron job ping server mỗi 14 phút (để Render không sleep)
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

// 🔹 Cron job xoá user chưa xác thực mỗi ngày lúc 00:00
const deleteUsersJob = new cron.CronJob("0 0 * * *", deleteUnverifiedUsers);

// 🔥 **BẮT ĐẦU CRON JOBS**
job.start();
deleteUsersJob.start();

console.log("🚀 Cron jobs đã khởi động!");

// Xuất cron jobs để có thể sử dụng ở nơi khác
export { job, deleteUsersJob };
