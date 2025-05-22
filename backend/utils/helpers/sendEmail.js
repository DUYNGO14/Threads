import { addEmailJob } from "../../queues/email.producer.js";

export const sendVerificationEmail = async (email, name, verificationOTP) => {
  try {
    await addEmailJob({
      to: email,
      templateId: process.env.VERIFICATION_EMAIL_TEMPLATE_ID,
      data: {
        name,
        verificationOtp: verificationOTP,
      },
    });
  } catch (error) {
    console.error("Error queueing verification email:", error.message);
  }
};

export const sendPasswordResetEmail = async (email, name, resetURL) => {
  try {
    await addEmailJob({
      to: email,
      templateId: process.env.PASSWORD_RESET_REQUEST_TEMPLATE_ID,
      data: {
        name,
        resetURL,
      },
    });
  } catch (error) {
    console.error("Error queueing password reset email:", error.message);
  }
};
