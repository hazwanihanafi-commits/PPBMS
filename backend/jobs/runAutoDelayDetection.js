import { readMasterTracking, writeSheetCell } from "../services/googleSheets.js";
import { EXPECTED_COLUMN_MAP } from "../utils/expectedColumnMap.js";
import { ACTUAL_COLUMN_MAP } from "../utils/timelineColumnMap.js";
import { DELAY_COLUMN_MAP } from "../utils/delayColumnMap.js";
import { sendDelayAlert } from "../services/mailer.js";

/* =========================================================
   🧠 SAFE GOOGLE SHEETS DATE PARSER
========================================================= */
function parseSheetDate(value) {
  if (!value) return null;

  // Google Sheets serial date (number)
  if (typeof value === "number") {
    const d = new Date(Math.round((value - 25569) * 86400 * 1000));
    return isNaN(d) ? null : d;
  }

  // Native Date
  if (value instanceof Date && !isNaN(value)) {
    return value;
  }

  const str = String(value).trim();

  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d) ? null : d;
  }

  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split("/");
    const d = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    return isNaN(d) ? null : d;
  }

  console.warn("⚠️ Unparseable date value:", value);
  return null;
}

/* =========================================================
   ⏰ AUTO DELAY DETECTION (FINAL)
========================================================= */
export async function runAutoDelayDetection() {
  console.log("🚀 Auto delay detection started");

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log("📅 Today (MY midnight):", today.toISOString().slice(0, 10));
  console.log("📊 Total rows read:", rows.length);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2; // Sheet row (row 1 = header)

    const studentEmail = row["Student's Email"];
    const studentName = row["Student Name"];
    const supervisorEmail = row["Main Supervisor's Email"];

    if (!studentEmail || !supervisorEmail) {
      console.log(`⏭️ Row ${rowIndex} skipped (missing email)`);
      continue;
    }

    console.log(`\n👤 Checking student [Row ${rowIndex}] ${studentEmail}`);

    const delays = [];

    for (const activity of Object.keys(EXPECTED_COLUMN_MAP)) {
      const expectedCol = EXPECTED_COLUMN_MAP[activity];
      const actualCol = ACTUAL_COLUMN_MAP[activity];
      const delayCols = DELAY_COLUMN_MAP[activity];

      if (!expectedCol || !actualCol || !delayCols) {
        console.log(`⚠️ ${activity} mapping missing, skipped`);
        continue;
      }

      const expectedRaw = row[expectedCol];
      const actualRaw = row[actualCol];
      const delaySent = row[delayCols.sent];

      console.log(`🔍 ${activity}`);
      console.log("   Expected raw:", expectedRaw);
      console.log("   Actual raw  :", actualRaw);
      console.log("   Delay sent  :", delaySent);

      // Skip completed
      if (actualRaw) {
        console.log("   ✅ Completed → skip");
        continue;
      }

      // Skip already emailed
      if (delaySent === "YES") {
        console.log("   📧 Already emailed → skip");
        continue;
      }

      const expectedDate = parseSheetDate(expectedRaw);
      if (!expectedDate) {
        console.log("   ❌ Expected date invalid → skip");
        continue;
      }

      expectedDate.setHours(0, 0, 0, 0);

      if (expectedDate < today) {
        const daysLate = Math.floor(
          (today - expectedDate) / (1000 * 60 * 60 * 24)
        );

        console.log(`   ⏰ DELAY DETECTED (${daysLate} days late)`);

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
      } else {
        console.log("   🟢 On track");
      }
    }

    // 📧 Send ONE email per student
    if (delays.length > 0) {
      console.log(`📨 Sending delay email to ${studentEmail}`);
      await sendDelayAlert({
        studentName,
        studentEmail,
        supervisorEmail,
        delays
      });
    } else {
      console.log("📭 No delays for this student");
    }
  }

  console.log("✅ Auto delay detection completed");
}
