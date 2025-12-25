import nodemailer from "nodemailer";

/* =====================================================
   SMTP TRANSPORT (RENDER-SAFE)
===================================================== */
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // 🔑 IMPORTANT
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // 🔑 Render needs this
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

/* =====================================================
   VERIFY SMTP ON STARTUP
===================================================== */
export async function verifySMTP() {
  try {
    await transporter.verify();
    console.log("✅ SMTP connection ready");
  } catch (err) {
    console.error("❌ SMTP verification failed:", err.message);
  }
}

/* =====================================================
   SEND DELAY ALERT EMAIL
===================================================== */
export async function sendDelayAlert({ to, student, delays }) {
  const body = delays
    .map(
      d =>
        `• ${d.activity} (Delayed ${Math.abs(d.remaining_days)} days)`
    )
    .join("\n");

  await transporter.sendMail({
    from: process.env.ALERT_FROM_EMAIL,
    to,
    subject: `[PPBMS] Student Delay Alert – ${student}`,
    text: `
Dear Supervisor,

The following milestones for your student (${student}) are delayed:

${body}

Please log in to PPBMS for further action.

— PPBMS System
`,
  });
}
