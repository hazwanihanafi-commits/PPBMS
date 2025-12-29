import sendEmail from "./sendEmail.js";

/* =========================================================
   ⏰ DELAY ALERT → STUDENT (CC SUPERVISOR + ADMIN)
========================================================= */
export async function sendDelayAlert({
  studentName,
  studentEmail,
  supervisorEmail,
  adminEmails = [],
  delays,
}) {
  const delayList = delays
    .map(d => `• ${d.activity} (Delayed ${Math.abs(d.remaining_days)} days)`)
    .join("\n");

  await sendEmail({
    to: studentEmail,
    cc: [supervisorEmail, ...adminEmails].filter(Boolean),
    subject: `[PPBMS] Milestone Delay Alert – ${studentName}`,
    text: `
Dear ${studentName},

The following research milestone(s) are currently delayed:

${delayList}

Please take the necessary action and consult your supervisor if required.

This notification is copied to your supervisor and the Graduate School
for monitoring purposes.

— PPBMS System
`,
  });
}

/* =========================================================
   📊 CQI ALERT → SUPERVISOR (CC ADMIN ONLY)
========================================================= */
export async function sendCQIAlert({
  supervisorEmail,
  adminEmails = [],
  studentName,
  matric,
  assessmentType,
  cqiIssues,
}) {
  const issuesText = cqiIssues
    .map(i => `• ${i.plo}: ${i.reason}`)
    .join("\n");

  await sendEmail({
    to: supervisorEmail,
    cc: adminEmails,
    subject: `[PPBMS] CQI Detected – ${studentName} (${assessmentType})`,
    text: `
Dear Supervisor,

Continuous Quality Improvement (CQI) has been automatically detected.

Student : ${studentName}
Matric  : ${matric}
Assessment : ${assessmentType}

Affected PLO(s):
${issuesText}

(Student is NOT copied.)

Please log in to PPBMS and record intervention within 30 days.

— PPBMS System
`,
  });
}

/* =========================================================
   🔔 CQI REMINDER → SUPERVISOR (CC ADMIN ONLY)
========================================================= */
export async function sendCQIReminder({
  supervisorEmail,
  adminEmails = [],
  studentName,
  matric,
  assessmentType,
  daysPending,
}) {
  await sendEmail({
    to: supervisorEmail,
    cc: adminEmails,
    subject: `[PPBMS] REMINDER: CQI Pending > ${daysPending} Days`,
    text: `
Dear Supervisor,

This is a reminder that a CQI case remains pending.

Student : ${studentName}
Matric  : ${matric}
Assessment : ${assessmentType}
Days pending : ${daysPending} days

(Student is NOT copied.)

— PPBMS System
`,
  });
}
