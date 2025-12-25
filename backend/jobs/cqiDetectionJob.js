import {
  readASSESSMENT_PLO,
  updateASSESSMENT_PLO_Cell
} from "../services/googleSheets.js";
import { extractCQIIssues } from "../utils/detectCQIRequired.js";
import { sendCQIAlert } from "../services/mailer.js";
import { readMasterTracking } from "../services/googleSheets.js";

export async function runCQIDetection() {
  const ploRows = await readASSESSMENT_PLO(process.env.SHEET_ID);
  const masterRows = await readMasterTracking(process.env.SHEET_ID);

  // Attach row index for update
  const rows = ploRows.map((r, i) => ({
    ...r,
    __rowIndex: i + 2
  }));

  for (const r of rows) {
    // ❌ already emailed → skip
    if (r.cqiemailsent === "YES") continue;

    // Detect CQI
    const issues = extractCQIIssues([r]);
    if (issues.length === 0) continue;

    // Find supervisor
    const student = masterRows.find(
      m => String(m["Matric"]).trim() === String(r.matric).trim()
    );
    if (!student) continue;

    // ✅ SEND EMAIL ONCE
    await sendCQIAlert({
      to: student["Main Supervisor's Email"],
      studentName: student["Student Name"],
      matric: r.matric,
      assessmentType: r.assessment_type,
      cqiIssues: issues
    });

    // ✅ MARK SENT
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
}
