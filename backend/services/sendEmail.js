import fetch from "node-fetch";

const EMAIL_API_KEY = process.env.EMAIL_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "PPBMS <no-reply@usm.my>";
const EMAIL_API_URL = process.env.EMAIL_API_URL; 
// e.g. https://api.resend.com/emails
// OR https://api.sendgrid.com/v3/mail/send

export default async function sendEmail({ to, cc, subject, text }) {
  if (!to || !subject || !text) {
    throw new Error("Missing required email fields");
  }

  // 🔒 Normalize recipients
  const toList = Array.isArray(to) ? to : [to];

  const payload = {
    from: EMAIL_FROM,
    to: toList,
    subject,
    text,
  };

  if (cc) {
    payload.cc = Array.isArray(cc) ? cc : [cc];
  }

  console.log("📤 FINAL EMAIL PAYLOAD", payload);

  const res = await fetch(EMAIL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${EMAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ EMAIL PROVIDER ERROR:", errorText);
    throw new Error(`Email send failed: ${res.status}`);
  }

  return true;
}
