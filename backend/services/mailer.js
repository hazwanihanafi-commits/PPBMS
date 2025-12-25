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

/* ===============================
   CQI INITIAL ALERT (SUPERVISOR)
=============================== */
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
    .map(i => `• ${i.plo} (Avg: ${i.average})`)
    .join("\n");

  await transporter.sendMail({
    from: process.env.ALERT_FROM_EMAIL,
    to,
    cc,
    subject: `[PPBMS][CQI] Action Required – ${studentName}`,
    text: `
Dear Supervisor,

CQI intervention is required for the following assessment:

Student: ${studentName}
Matric: ${matric}
Assessment: ${assessmentType}

PLOs below threshold:
${issueList}

Supervisor Remark:
${remark || "-"}

Please record your intervention in PPBMS.

— PPBMS System
`
  });
}

/* ===============================
   CQI ESCALATION (PROGRAMME LEVEL)
=============================== */
export async function sendCQIEscalation({
  to,
  studentName,
  matric,
  assessmentType,
  daysOverdue
}) {
  await transporter.sendMail({
    from: process.env.ALERT_FROM_EMAIL,
    to,
    subject: `[PPBMS][ESCALATION] CQI Overdue > ${daysOverdue} Days`,
    text: `
Dear Programme Coordinator,

A CQI intervention has not been recorded within ${daysOverdue} days.

Student: ${studentName}
Matric: ${matric}
Assessment: ${assessmentType}

Please follow up with the supervisor.

— PPBMS System
`
  });
}
