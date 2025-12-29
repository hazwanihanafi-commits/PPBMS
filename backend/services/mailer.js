import sendEmail from "./sendEmail.js";

/* =========================================================
   ⏰ DELAY ALERT → STUDENT (CC SUPERVISOR ONLY)
========================================================= */
export async function sendDelayAlert({
  studentName,
  studentEmail,
  supervisorEmail,
  delays,
}) {
  // ✅ Basic validation
  if (!studentEmail || !studentEmail.includes("@")) {
    throw new Error("Invalid student email");
  }

  if (!supervisorEmail || !supervisorEmail.includes("@")) {
    throw new Error("Invalid supervisor email");
  }

  if (!Array.isArray(delays)) {
    throw new Error("Delays must be an array");
  }

  // ✅ Validate milestones
  const validDelays = delays.filter(
    d => d && d.activity && typeof d.remaining_days === "number"
  );

  if (validDelays.length === 0) {
    throw new Error("No valid delayed milestones");
  }

  const delayList = validDelays
    .map(d => `• ${d.activity} (Delayed ${Math.abs(d.remaining_days)} days)`)
    .join("\n");

  const emailText = (
    `Dear ${studentName},

The following research milestone(s) are currently delayed:

${delayList}

Please take the necessary action and consult your supervisor if required.

This notification is copied to your supervisor for monitoring purposes.

— PPBMS System`
  ).trim();

  console.log("📧 Sending delay alert:", {
    to: studentEmail,
    cc: supervisorEmail,
    milestones: validDelays.map(d => d.activity),
  });

  // ✅ Provider-safe payload (NO arrays, NO empty fields)
  await sendEmail({
    to: studentEmail,
    cc: supervisorEmail, // STRING ONLY
    subject: `[PPBMS] Milestone Delay Alert – ${studentName}`,
    text: emailText,
  });
}

/* =========================================================
   📊 CQI ALERT → SUPERVISOR (STUDENT NOT COPIED)
========================================================= */
export async function sendCQIAlert({
  supervisorEmail,
  studentName,
  matric,
  assessmentType,
  cqiIssues,
}) {
  if (!supervisorEmail || !supervisorEmail.includes("@")) {
    throw new Error("Invalid supervisor email");
  }

  if (!Array.isArray(cqiIssues) || cqiIssues.length === 0) {
    throw new Error("Invalid CQI issues");
  }

  const issuesText = cqiIssues
    .map(i => `• ${i.plo}: ${i.reason}`)
    .join("\n");

  const emailText = (
    `Dear Supervisor,

Continuous Quality Improvement (CQI) has been automatically detected.

Student    : ${studentName}
Matric     : ${matric}
Assessment : ${assessmentType}

Affected PLO(s):
${issuesText}

(Student is NOT copied.)

Please log in to PPBMS and record intervention within 30 days.

— PPBMS System`
  ).trim();

  await sendEmail({
    to: supervisorEmail,
    subject: `[PPBMS] CQI Detected – ${studentName} (${assessmentType})`,
    text: emailText,
  });
}

/* =========================================================
   🔔 CQI REMINDER → SUPERVISOR
========================================================= */
export async function sendCQIReminder({
  supervisorEmail,
  studentName,
  matric,
  assessmentType,
  daysPending,
}) {
  if (!supervisorEmail || !supervisorEmail.includes("@")) {
    throw new Error("Invalid supervisor email");
  }

  const emailText = (
    `Dear Supervisor,

This is a reminder that a CQI case remains pending.

Student    : ${studentName}
Matric     : ${matric}
Assessment : ${assessmentType}
Days pending : ${daysPending} days

(Student is NOT copied.)

— PPBMS System`
  ).trim();

  await sendEmail({
    to: supervisorEmail,
    subject: `[PPBMS] REMINDER: CQI Pending > ${daysPending} Days`,
    text: emailText,
  });
}
