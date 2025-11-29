// backend/services/sendEmail.js
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function sendEmail({ to, subject, text, html }) {
  return sgMail.send({
    to,
    from: process.env.EMAIL_FROM,
    subject,
    text,
    html: html || text,
  });
}
