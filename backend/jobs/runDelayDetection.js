import { readMasterTracking, writeSheetCell } from "../services/googleSheets.js";
import { EXPECTED_COLUMN_MAP } from "../utils/expectedColumnMap.js";
import { ACTUAL_COLUMN_MAP } from "../utils/timelineColumnMap.js";
import { DELAY_COLUMN_MAP } from "../utils/delayColumnMap.js";
import { sendDelayEmail } from "../services/mailer.js";

export async function runDelayDetection() {
  const rows = await readMasterTracking(process.env.SHEET_ID);
  const today = new Date().toISOString().split("T")[0];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2; // header offset

    const studentEmail = row["Student's Email"];
    const supervisorEmail = row["Main Supervisor's Email"];

    if (!studentEmail) continue;

    for (const activity of Object.keys(EXPECTED_COLUMN_MAP)) {
      const expectedCol = EXPECTED_COLUMN_MAP[activity];
      const actualCol = ACTUAL_COLUMN_MAP[activity];
      const delayCols = DELAY_COLUMN_MAP[activity];

      if (!expectedCol || !actualCol || !delayCols) continue;

      const expected = row[expectedCol];
      const actual = row[actualCol];
      const delaySent = row[delayCols.sent];

      // 🔴 CONDITIONS FOR AUTO DELAY
      if (
        expected &&
        !actual &&
        new Date(expected) < new Date(today) &&
        !delaySent
      ) {
        // ✅ Write delay flags
        await writeSheetCell(
          process.env.SHEET_ID,
          "MasterTracking",
          delayCols.sent,
          rowIndex,
          "YES"
        );

        await writeSheetCell(
          process.env.SHEET_ID,
          "MasterTracking",
          delayCols.date,
          rowIndex,
          today
        );

        // 📧 Send email
        await sendDelayEmail({
          to: studentEmail,
          cc: supervisorEmail,
          activity,
          expectedDate: expected
        });
      }
    }
  }
}
