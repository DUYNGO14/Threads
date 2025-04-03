import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost/your-db"
    );
    console.log("Đã kết nối tới MongoDB");
  } catch (err) {
    console.error("Lỗi kết nối MongoDB:", err);
    process.exit(1); // Dừng ứng dụng nếu không thể kết nối
  }
};

export default connectDB;
