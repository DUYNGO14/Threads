import resendEmail from "../config/resendmail.js";
import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates.js";

const sendVerificationEmail = async (email, verificationOTP) => {
  try {
    console.log(`🔹 Sending OTP ${verificationOTP} to ${email}`);

    if (!email || !verificationOTP) {
      throw new Error("Missing email or OTP");
    }

    const verificationEmail = VERIFICATION_EMAIL_TEMPLATE.replace(
      "{verificationOtp}",
      verificationOTP
    );

    return await resendEmail(email, "🔒 Verify Your Email", verificationEmail);
  } catch (error) {
    console.error("❌ Error sending verification email:", error.message);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, resetURL) => {
  try {
    console.log(`🔹 Sending password reset email to: ${email}`);
    console.log(`🔹 Reset URL: ${resetURL}`);

    if (!email || !resetURL) {
      throw new Error("Missing email or reset URL");
    }

    const passwordResetEmail = PASSWORD_RESET_REQUEST_TEMPLATE.replace(
      "{resetURL}",
      resetURL
    );

    return await resendEmail(
      email,
      "🔑 Password Reset Request",
      passwordResetEmail
    );
  } catch (error) {
    console.error("❌ Error sending password reset email:", error.message);
    throw error;
  }
};

export { sendVerificationEmail, sendPasswordResetEmail };
