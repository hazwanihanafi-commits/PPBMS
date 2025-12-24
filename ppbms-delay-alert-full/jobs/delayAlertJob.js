import { readMasterTracking } from "../services/googleSheets.js";
import { sendEmail } from "../services/mailer.js";
import { logAlert } from "../services/alertLog.js";

export async function runDelayAlert() {
  const rows = await readMasterTracking(process.env.SHEET_ID);
  const today = new Date();

  for (const r of rows) {
    const due = new Date(r["Due Date"]);
    const completed = (r["Progress"] || "").toLowerCase() === "completed";
    if (!completed && due < today) {
      const supervisorEmail = r["Main Supervisor's Email"];
      if (!supervisorEmail) continue;

      await sendEmail({
        to: supervisorEmail,
        subject: "PPBMS Alert – Student Progress Delay Detected",
        text: `Student ${r["Student Name"]} has delayed milestone: ${r["Milestone"]}`
      });

      await logAlert({
        student: r["Student Name"],
        supervisor: supervisorEmail,
        milestone: r["Milestone"],
        due: r["Due Date"]
      });
    }
  }
}
