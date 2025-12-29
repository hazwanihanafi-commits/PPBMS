const EMAIL_API_KEY = process.env.EMAIL_API_KEY;
const EMAIL_API_URL = process.env.EMAIL_API_URL;
const EMAIL_FROM = process.env.EMAIL_FROM || "PPBMS <no-reply@usm.my>";

export default async function sendEmail({ to, cc, subject, text }) {
  if (!EMAIL_API_URL || !EMAIL_API_URL.startsWith("http")) {
    throw new Error(
      `Invalid EMAIL_API_URL: ${EMAIL_API_URL}. Must be absolute (https://...)`
    );
  }

  if (!EMAIL_API_KEY) {
    throw new Error("Missing EMAIL_API_KEY");
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

  console.log("📨 FINAL EMAIL PAYLOAD", payload);
  console.log("🌐 EMAIL_API_URL", EMAIL_API_URL);

  const res = await fetch(EMAIL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${EMAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ EMAIL PROVIDER ERROR:", err);
    throw new Error(`Email send failed (${res.status})`);
  }

  return true;
}
