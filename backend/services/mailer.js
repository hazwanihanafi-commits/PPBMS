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
    .map(
      d => `• ${d.activity} (Delayed ${Math.abs(d.remaining_days)} days)`
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
   📊 CQI ALERT → SUPERVISOR
========================================================= */
export async function sendCQIAlert({
  to,
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
Dear Supervisor,

A CQI issue has been identified.

Student : ${studentName}
Matric  : ${matric}
Assessment : ${assessmentType}

CQI Issues:
${issuesText}

Supervisor Remark:
${remark || "No remark provided."}

Please record your intervention in PPBMS.

— PPBMS System
`;

  await transporter.sendMail({
    from: process.env.ALERT_FROM_EMAIL,
    to,
    subject: `[PPBMS] CQI Required – ${studentName}`,
    text,
  });
}

/* =========================================================
   🔔 CQI REMINDER (30 DAYS)
========================================================= */
export async function sendCQIReminder({
  to,
  studentName,
  matric,
  assessmentType,
  daysPending
}) {
  const text = `
Dear Supervisor,

This is a reminder that a CQI issue has not been addressed.

Student : ${studentName}
Matric  : ${matric}
Assessment : ${assessmentType}
Days pending : ${daysPending} days

Please take action in PPBMS.

— PPBMS System
`;

  await transporter.sendMail({
    from: process.env.ALERT_FROM_EMAIL,
    to,
    subject: `[PPBMS] CQI Reminder – Action Required`,
    text
  });
}

export async function sendCQIReminder({
  to,
  studentName,
  matric,
  assessmentType,
  daysOverdue
}) {
  const text = `
Dear Supervisor,

This is a reminder that Continuous Quality Improvement (CQI) action
was identified for your student:

Student: ${studentName}
Matric: ${matric}
Assessment: ${assessmentType}

No supervisor remark or intervention plan has been recorded
${daysOverdue} days after the CQI notification.

Please log in to PPBMS and record your remarks and intervention plan.

— PPBMS System
`;

  await transporter.sendMail({
    from: process.env.ALERT_FROM_EMAIL,
    to,
    subject: `[PPBMS] CQI Reminder – Action Required`,
    text
  });
}
