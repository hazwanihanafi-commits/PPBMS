import { readMasterTracking, writeSheetCell } from "../services/googleSheets.js";
import { EXPECTED_COLUMN_MAP } from "../utils/expectedColumnMap.js";
import { ACTUAL_COLUMN_MAP } from "../utils/timelineColumnMap.js";
import { DELAY_COLUMN_MAP } from "../utils/delayColumnMap.js";
import { sendDelayAlert } from "../services/mailer.js";

/* =========================================================
   🧠 SAFE DATE PARSER (ISO + MY FORMAT)
========================================================= */
function parseSheetDate(value) {
  if (!value) return null;

  // Google Sheets Date object
  if (value instanceof Date && !isNaN(value)) {
    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const str = String(value).trim();

  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d)) {
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }

  // MY format: DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split("/");
    const d = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
    if (!isNaN(d)) {
      d.setHours(0, 0, 0, 0);
      return d;
    }
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
  today.setHours(0, 0, 0, 0); // date-only (timezone safe)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2; // Sheet row (row 1 = header)

    const studentEmail = row["Student's Email"];
    const studentName = row["Student Name"];
    const supervisorEmail = row["Main Supervisor's Email"];

    // 🔒 Basic guards
    if (!studentEmail || !studentEmail.includes("@")) continue;
    if (!supervisorEmail || !supervisorEmail.includes("@")) continue;

    const delays = [];

    for (const activity of Object.keys(EXPECTED_COLUMN_MAP)) {
      const expectedCol = EXPECTED_COLUMN_MAP[activity];
      const actualCol = ACTUAL_COLUMN_MAP[activity];
      const delayCols = DELAY_COLUMN_MAP[activity];

      if (!expectedCol || !actualCol || !delayCols) continue;

      const expectedRaw = row[expectedCol];
      const actualRaw = row[actualCol];
      const delaySent = row[delayCols.sent];

      // ⛔ Skip if completed or already emailed
      if (actualRaw || delaySent === "YES") continue;

      const expectedDate = parseSheetDate(expectedRaw);
      if (!expectedDate) continue;

      // 🔴 DELAY CONDITION
      if (expectedDate < today) {
        const daysLate = Math.floor(
          (today - expectedDate) / (1000 * 60 * 60 * 24)
        );

        console.log("⏰ Delay detected:", {
          row: rowIndex,
          student: studentEmail,
          activity,
          expected: expectedRaw,
          daysLate
        });

        delays.push({
          activity,
          remaining_days: daysLate,
          delayCols,
          rowIndex
        });
      }
    }

    /* =====================================================
       📧 SEND EMAIL FIRST (CRITICAL FIX)
    ===================================================== */
    if (delays.length > 0) {
      try {
        await sendDelayAlert({
          studentName,
          studentEmail,
          supervisorEmail,
          delays
        });

        console.log("📧 Delay email sent:", studentEmail);

        // ✅ Mark sheet ONLY after email success
        for (const d of delays) {
          await writeSheetCell(
            process.env.SHEET_ID,
            "MasterTracking",
            d.delayCols.sent,
            d.rowIndex,
            "YES"
          );

          await writeSheetCell(
            process.env.SHEET_ID,
            "MasterTracking",
            d.delayCols.date,
            d.rowIndex,
            today.toISOString().slice(0, 10)
          );
        }

      } catch (err) {
        console.error("❌ Delay email failed:", {
          student: studentEmail,
          error: err.message
        });
        // ❗ DO NOT write sheet → allow retry next run
      }
    }
  }

  console.log("✅ Auto delay detection completed");
}
