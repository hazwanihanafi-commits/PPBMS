import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export async function getTransport(){
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  return transporter;
}

export async function sendEmail(to, subject, text, html){
  const t = await getTransport();
  return t.sendMail({ from: process.env.EMAIL_FROM, to, subject, text, html });
}
