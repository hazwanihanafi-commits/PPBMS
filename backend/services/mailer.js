import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* =========================
   EXISTING: DELAY ALERT
========================= */
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

Please log in to PPBMS for further action.

— PPBMS System
`,
  });
}

/* =========================
   ✅ NEW: CQI ALERT EMAIL
========================= */
export async function sendCQIAlert({
  to,
  cc,
  studentName,
  matric,
  assessmentType,
  cqiIssues,
  remark
}) {
  const issueList = cqiIssues
    .map(p => `• ${p.plo} (Average: ${p.average})`)
    .join("\n");

  await transporter.sendMail({
    from: process.env.ALERT_FROM_EMAIL,
    to,
    cc,
    subject: `[PPBMS] CQI Intervention Required – ${studentName}`,
    text: `
Dear ${studentName},

Based on the Continuous Quality Improvement (CQI) review for the
${assessmentType} assessment, the following Programme Learning Outcomes
require improvement:

${issueList}

Supervisor Intervention:
${remark || "Please refer to supervisor guidance in the system."}

Student Details:
Name   : ${studentName}
Matric : ${matric}

You are advised to review the feedback and take corrective actions in
consultation with your supervisor.

This CQI intervention is part of the programme quality assurance process
in accordance with MQA requirements.

Regards,
PPBMS System
`,
  });
}
