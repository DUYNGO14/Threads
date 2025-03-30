import emailService from "../../config/emailService.js";

const sendVerificationEmail = async (email, name, verificationOTP) => {
  try {
    await emailService(email, process.env.VERIFICATION_EMAIL_TEMPLATE_ID, {
      name: name,
      verificationOtp: verificationOTP,
    });
  } catch (error) {
    console.error("Error sending verification email:", error.message);
  }
};

const sendPasswordResetEmail = async (email, name, resetURL) => {
  try {
    await emailService(email, process.env.PASSWORD_RESET_REQUEST_TEMPLATE_ID, {
      name: name,
      resetURL: resetURL,
    });
  } catch (error) {
    console.error("Error sending password reset email:", error.message);
  }
};

export { sendVerificationEmail, sendPasswordResetEmail };
