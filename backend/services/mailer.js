import nodemailer from "nodemailer";

/* =========================================================
   SMTP TRANSPORTER
========================================================= */
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true only for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

/* =========================================================
   VERIFY SMTP ON SERVER START
========================================================= */
export async function verifySMTP() {
  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified");
  } catch (err) {
    console.error("❌ SMTP verification failed:", err.message);
  }
}

/* =========================================================
   DELAY ALERT (SUPERVISOR)
========================================================= */
export async function sendDelayAlert({ to, student, delays }) {
  const body = delays
    .map(
      d =>
        `• ${d.activity} (Delayed ${Math.abs(d.remaining_days)} days)`
    )
    .join("\n");

  const text = `
Dear Supervisor,

The following milestones for your student (${student}) are delayed:

${body}

Please log in to PPBMS for monitoring and intervention.

— PPBMS System
`;

  await transporter.sendMail({
    from: process.env.ALERT_FROM_EMAIL,
    to,
    subject: `[PPBMS] Student Delay Alert – ${student}`,
    text,
  });
}

/* =========================================================
   CQI ALERT (STUDENT + SUPERVISOR)
========================================================= */
export async function sendCQIAlert({
  to,
  cc,
  studentName,
  matric,
  assessmentType,
  cqiIssues,
  remark,
}) {
  const issuesText = cqiIssues
    .map(i => `• ${i.plo}: ${i.reason}`)
    .join("\n");

  const text = `
Dear ${studentName},

Following the assessment (${assessmentType}), Continuous Quality Improvement (CQI)
has been identified for the following Programme Learning Outcomes:

${issuesText}

Supervisor Remark:
${remark || "No additional remark provided."}

Please take the necessary corrective actions and consult your supervisor.

— PPBMS System
`;

  await transporter.sendMail({
    from: process.env.ALERT_FROM_EMAIL,
    to,
    cc,
    subject: `[PPBMS] CQI Required – ${assessmentType} (${matric})`,
    text,
  });
}
