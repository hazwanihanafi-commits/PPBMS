import { readMasterTracking, writeSheetCell } from "../services/googleSheets.js";
import { EXPECTED_COLUMN_MAP } from "../utils/expectedColumnMap.js";
import { ACTUAL_COLUMN_MAP } from "../utils/timelineColumnMap.js";
import { DELAY_COLUMN_MAP } from "../utils/delayColumnMap.js";
import { sendDelayAlert } from "../services/mailer.js";

export async function runAutoDelayDetection() {
  const rows = await readMasterTracking(process.env.SHEET_ID);
  const today = new Date().toISOString().split("T")[0];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2; // header offset

    const studentEmail = row["Student's Email"];
    const studentName = row["Student Name"];
    const supervisorEmail = row["Main Supervisor's Email"];

    if (!studentEmail || !supervisorEmail) continue;

    const delays = [];

    for (const activity of Object.keys(EXPECTED_COLUMN_MAP)) {
      const expectedCol = EXPECTED_COLUMN_MAP[activity];
      const actualCol = ACTUAL_COLUMN_MAP[activity];
      const delayCols = DELAY_COLUMN_MAP[activity];

      if (!expectedCol || !actualCol || !delayCols) continue;

      const expected = row[expectedCol];
      const actual = row[actualCol];
      const delaySent = row[delayCols.sent];

      if (
        expected &&
        !actual &&
        new Date(expected) < new Date(today) &&
        !delaySent
      ) {
        const remainingDays =
          Math.ceil(
            (new Date(today) - new Date(expected)) / (1000 * 60 * 60 * 24)
          );

        // ✅ Write DELAY EMAIL SENT
        await writeSheetCell(
          process.env.SHEET_ID,
          "MasterTracking",
          delayCols.sent,
          rowIndex,
          "YES"
        );

        // ✅ Write DELAY EMAIL DATE
        await writeSheetCell(
          process.env.SHEET_ID,
          "MasterTracking",
          delayCols.date,
          rowIndex,
          today
        );

        delays.push({
          activity,
          remaining_days: remainingDays,
        });
      }
    }

    // 📧 SEND EMAIL IF ANY DELAYS FOUND
    if (delays.length > 0) {
      await sendDelayAlert({
        studentName,
        studentEmail,
        supervisorEmail,
        delays,
      });
    }
  }
}
