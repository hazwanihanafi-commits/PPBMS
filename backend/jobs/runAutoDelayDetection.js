import { readMasterTracking, writeSheetCell } from "../services/googleSheets.js";
import { EXPECTED_COLUMN_MAP } from "../utils/expectedColumnMap.js";
import { ACTUAL_COLUMN_MAP } from "../utils/timelineColumnMap.js";
import { DELAY_COLUMN_MAP } from "../utils/delayColumnMap.js";
import { sendDelayAlert } from "../services/mailer.js";

/* =========================================================
   🧠 SAFE DATE PARSER (MY / ISO AWARE)
========================================================= */
function parseSheetDate(value) {
  if (!value) return null;

  // Already a Date object
  if (value instanceof Date && !isNaN(value)) {
    return value;
  }

  const str = String(value).trim();

  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d) ? null : d;
  }

  // DD/MM/YYYY (Malaysia standard)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split("/");
    const d = new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    );
    return isNaN(d) ? null : d;
  }

  console.warn("⚠️ Unparseable date value:", value);
  return null;
}

/* =========================================================
   ⏰ AUTO DELAY DETECTION JOB
========================================================= */
export async function runAutoDelayDetection() {
  console.log("🚀 Auto delay detection started");

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // midnight MY-safe

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2; // sheet row (1 = header)

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

      const expectedRaw = row[expectedCol];
      const actualRaw = row[actualCol];
      const delaySent = row[delayCols.sent];

      // Skip if already completed or already emailed
      if (actualRaw || delaySent === "YES") continue;

      const expectedDate = parseSheetDate(expectedRaw);
      if (!expectedDate) continue;

      expectedDate.setHours(0, 0, 0, 0);

      if (expectedDate < today) {
        const daysLate = Math.floor(
          (today - expectedDate) / (1000 * 60 * 60 * 24)
        );

        console.log("⏰ Delay detected:", {
          student: studentEmail,
          activity,
          expected: expectedRaw,
          daysLate
        });

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
          today.toISOString().slice(0, 10)
        );

        delays.push({
          activity,
          remaining_days: daysLate
        });
      }
    }

    // 📧 Send ONE email per student per run
    if (delays.length > 0) {
      await sendDelayAlert({
        studentName,
        studentEmail,
        supervisorEmail,
        delays
      });
    }
  }

  console.log("✅ Auto delay detection completed");
}
