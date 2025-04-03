import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();
// Cấu hình API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function emailService(to, templateId, dynamicTemplateData) {
  const msg = {
    to,
    from: {
      email: process.env.FROM_EMAIL,
      name: "Website Threads",
    },
    templateId: templateId,
    dynamicTemplateData: dynamicTemplateData,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Email sent successfully to:", to);
  } catch (error) {
    console.error(
      "❌ Error sending email:",
      error.response ? error.response.body : error
    );
  }
}

export default emailService;
