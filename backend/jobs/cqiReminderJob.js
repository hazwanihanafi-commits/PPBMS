import {
  readASSESSMENT_PLO,
  readMasterTracking,
  updateASSESSMENT_PLO_Cell
} from "../services/googleSheets.js";

import { sendCQIReminder } from "../services/mailer.js";

export async function runCQIReminderCheck() {
  const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);
  const students = await readMasterTracking(process.env.SHEET_ID);

  const today = new Date();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];

    if (r.cqi_email_sent !== "YES") continue;
    if (r.cqi_response_date) continue;
    if (!r.cqi_email_date) continue;

    const sentDate = new Date(r.cqi_email_date);
    const diffDays = Math.floor(
      (today - sentDate) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 30) continue;

    const student = students.find(
      s => String(s.Matric).trim() === String(r.matric).trim()
    );

    if (!student) continue;

    await sendCQIReminder({
      to: student["Main Supervisor's Email"],
      studentName: student["Student Name"],
      matric: student["Matric"],
      assessmentType: r.assessment_type,
      daysOverdue: diffDays
    });

    // ✅ Optional: prevent repeated reminders (comment out if you want weekly)
    await updateASSESSMENT_PLO_Cell({
      rowIndex: i + 2,
      column: "CQI_REMINDER_SENT",
      value: "YES"
    });
  }

  console.log("✅ CQI reminder check completed");
}
