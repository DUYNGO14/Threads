import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const resendEmail = async (to, subject, html) => {
  try {
    console.log(`🔹 Sending email to: ${to}`);

    const res = await fetch(process.env.RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Website Threads <onboarding@resend.dev>", // Resend cung cấp email này
        to,
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    console.log("✅ Email sent successfully!", data);
    return data;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw error;
  }
};

export default resendEmail;
