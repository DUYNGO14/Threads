import transporter from "../config/nodemailer.js";
import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates.js";

const sendVerificationEmail = async (email, verificationOTP) => {
  try {
    // Log OTP để debug
    console.log(`🔹 Sending OTP ${verificationOTP} to ${email}`);

    // Kiểm tra nếu email hoặc OTP bị thiếu
    if (!email || !verificationOTP) {
      throw new Error("Missing email or OTP");
    }

    // Thay thế mã OTP vào template
    const verificationEmail = VERIFICATION_EMAIL_TEMPLATE.replace(
      "{verificationOtp}",
      verificationOTP
    );

    // Gửi email qua transporter (Mailtrap / SMTP)
    const info = await transporter.sendMail({
      from: '"Website Threads" <no-reply@yourdomain.com>', // Địa chỉ email hợp lệ
      to: email,
      subject: "🔒 Verify Your Email",
      html: verificationEmail,
    });

    console.log("✅ Email sent successfully!", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending verification email:", error.message);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, resetURL) => {
  try {
    // Debug resetURL trước khi gửi
    console.log(`🔹 Sending password reset email to: ${email}`);
    console.log(`🔹 Reset URL: ${resetURL}`);

    // Kiểm tra nếu email hoặc resetURL bị thiếu
    if (!email || !resetURL) {
      throw new Error("Missing email or reset URL");
    }

    // Thay thế resetURL vào template
    const passwordResetEmail = PASSWORD_RESET_REQUEST_TEMPLATE.replace(
      "{resetURL}",
      resetURL
    );

    // Gửi email qua transporter
    const info = await transporter.sendMail({
      from: '"Website Threads" <no-reply@yourdomain.com>', // Đổi thành email hợp lệ
      to: email,
      subject: "🔑 Password Reset Request",
      html: passwordResetEmail,
    });

    console.log("✅ Password reset email sent successfully!", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending password reset email:", error.message);
    throw error;
  }
};

export { sendVerificationEmail, sendPasswordResetEmail };
