import nodemailer from "nodemailer";

/* =========================================================
   SMTP TRANSPORTER
========================================================= */
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

/* =========================================================
   VERIFY SMTP
========================================================= */
export async function verifySMTP() {
  try {
    await transporter.verify();
    console.log("✅ SMTP verified");
  } catch (e) {
    console.error("❌ SMTP failed:", e.message);
  }
}

/* =========================================================
   ⏰ DELAY ALERT → SUPERVISOR
========================================================= */
export async function sendDelayAlert({ to, student, delays }) {
  const body = delays
    .map(d => `• ${d.activity} (Delayed ${Math.abs(d.remaining_days)} days)`)
    .join("\n");

  await transporter.sendMail({
    from: process.env.ALERT_FROM_EMAIL,
    to,
    subject: `[PPBMS] Student Delay Alert – ${student}`,
    text: `
Dear Supervisor,

The following milestones for your student (${student}) are delayed:

${body}

Please log in to PPBMS for monitoring and intervention.

— PPBMS System
`,
  });
}

/* =========================================================
   📊 CQI ALERT → SUPERVISOR
   (AUTO when low performance detected)
========================================================= */
export async function sendCQIAlert({
  to,
  studentName,
  matric,
  assessmentType,
  cqiIssues,
}) {
  const issuesText = cqiIssues
    .map(i => `• ${i.plo}: ${i.reason}`)
    .join("\n");

  await transporter.sendMail({
    from: process.env.ALERT_FROM_EMAIL,
    to,
    subject: `[PPBMS] CQI Detected – ${studentName} (${assessmentType})`,
    text: `
Dear Supervisor,

Continuous Quality Improvement (CQI) has been automatically detected.

Student : ${studentName}
Matric  : ${matric}
Assessment : ${assessmentType}

Affected PLO(s):
${issuesText}

Please log in to PPBMS and record your remarks and intervention plan
within 30 days.

— PPBMS System
`,
  });
}

/* =========================================================
   🔔 CQI REMINDER → SUPERVISOR (AFTER 30 DAYS)
========================================================= */
export async function sendCQIReminder({
  to,
  studentName,
  matric,
  assessmentType,
  daysPending,
}) {
  await transporter.sendMail({
    from: process.env.ALERT_FROM_EMAIL,
    to,
    subject: `[PPBMS] REMINDER: CQI Pending > ${daysPending} Days`,
    text: `
Dear Supervisor,

This is a reminder that a CQI case remains pending without any
remark or intervention recorded.

Student : ${studentName}
Matric  : ${matric}
Assessment : ${assessmentType}
Days pending : ${daysPending} days

Please log in to PPBMS and take action.

— PPBMS System
`,
  });
}
