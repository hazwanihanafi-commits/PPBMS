import fetch from "node-fetch";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// ⚠️ TEST MODE SENDER (no domain needed)
const EMAIL_FROM = "PPBMS <onboarding@resend.dev>";

export default async function sendEmail({ to, subject, text }) {
  if (!RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const payload = {
    from: EMAIL_FROM,
    to: [to], // MUST be your own email
    subject,
    text,
  };

  console.log("📨 TEST EMAIL PAYLOAD", payload);

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
