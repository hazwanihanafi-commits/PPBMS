import { sendCQIAlert } from "../services/mailer.js";
import { updateASSESSMENT_PLO_Cell } from "../services/googleSheets.js";

export async function triggerCQIIfNeeded({
  student,
  assessmentType,
  assessmentRows,
  issues
}) {
  const alreadySent = assessmentRows.some(
    r => r.cqi_email_sent === "YES"
  );

  if (issues.length === 0 || alreadySent) return false;

  // 🔔 SEND EMAIL TO SUPERVISOR
  await sendCQIAlert({
  supervisorEmail: student["Main Supervisor's Email"],
  studentName: student["Student Name"],
  matric: student["Matric"],
  studentStatus: student["Status"],
  assessmentType,
  cqiIssues: issues
});

  // 🏷️ FLAG ALL RELATED ROWS
  for (const r of assessmentRows) {
    await updateASSESSMENT_PLO_Cell({
      rowIndex: r.__rowIndex,
      column: "CQI_EMAIL_SENT",
      value: "YES"
    });

    await updateASSESSMENT_PLO_Cell({
      rowIndex: r.__rowIndex,
      column: "CQI_EMAIL_DATE",
      value: new Date().toISOString().slice(0, 10)
    });
  }

  return true;
}
