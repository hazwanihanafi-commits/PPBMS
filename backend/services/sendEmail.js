import fetch from "node-fetch";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "PPBMS <onboarding@resend.dev>";

export default async function sendEmail({ to, cc, subject, text }) {
  if (!RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  if (!to || !subject || !text) {
    throw new Error("Missing required email fields");
  }

  const payload = {
    from: EMAIL_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
  };

  if (cc) {
    payload.cc = Array.isArray(cc) ? cc : [cc];
  }

  console.log("📨 RESEND PAYLOAD", payload);

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
