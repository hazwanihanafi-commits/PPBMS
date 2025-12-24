import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, text }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: "ppbms@system.local",
    to,
    subject,
    text
  });
}
