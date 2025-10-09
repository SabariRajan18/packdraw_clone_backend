import nodemailer from "nodemailer";

const sendMailer = async ({ to, subject, html, text }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Black Cat Mailer" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`Mail sent to ${to}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

export default sendMailer;
