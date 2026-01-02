import fetch from "node-fetch";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = "PPBMS <no-reply@ppbms.my>"; // ✅ VERIFIED DOMAIN

export default async function sendEmail({ to, cc, subject, text }) {
  if (!RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const payload = {
    from: EMAIL_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
  };

  // Optional CC (supervisor)
  if (cc) {
    payload.cc = Array.isArray(cc) ? cc : [cc];
  }

  console.log("📨 EMAIL PAYLOAD", payload);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ RESEND ERROR:", err);
    throw new Error(`Email send failed (${res.status})`);
  }

  return true;
}
