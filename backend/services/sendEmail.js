const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@usm.my";

export default async function sendEmail({ to, cc, subject, text }) {
  if (!SENDGRID_API_KEY) {
    throw new Error("Missing SENDGRID_API_KEY");
  }

  if (!to || !subject || !text) {
    throw new Error("Missing required email fields");
  }

  const payload = {
    personalizations: [
      {
        to: [{ email: to }],
        ...(cc ? { cc: [{ email: cc }] } : {}),
        subject,
      },
    ],
    from: { email: EMAIL_FROM.replace(/.*<|>.*/g, "") },
    content: [
      {
        type: "text/plain",
        value: text,
      },
    ],
  };

  console.log("📨 SENDGRID PAYLOAD", JSON.stringify(payload, null, 2));

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ SENDGRID ERROR:", err);
    throw new Error(`Email send failed (${res.status})`);
  }

  return true;
}
