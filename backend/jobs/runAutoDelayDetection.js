import { readMasterTracking, writeSheetCell } from "../services/googleSheets.js";
import { TIMELINE_MAP } from "../utils/timelineMap.js";
import { sendDelayAlert } from "../services/mailer.js";

/* =========================================================
   🧠 SAFE EMPTY CELL CHECK
========================================================= */
function isEmptyCell(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

/* =========================================================
   🧠 SAFE GOOGLE SHEETS DATE PARSER
========================================================= */
function parseSheetDate(value) {
  if (isEmptyCell(value)) return null;

  // Google Sheets serial number
  if (typeof value === "number") {
    const d = new Date(Math.round((value - 25569) * 86400 * 1000));
    return isNaN(d) ? null : d;
  }

  // Native Date
  if (value instanceof Date && !isNaN(value)) {
    return value;
  }

  const str = String(value).trim();

  // ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d) ? null : d;
  }

  // DD/MM/YYYY (Malaysia)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split("/");
    const d = new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    );
    return isNaN(d) ? null : d;
  }

  console.warn("⚠️ Unparseable date:", value);
  return null;
}

/* =========================================================
   ⏰ AUTO DELAY DETECTION — FINAL
========================================================= */
export async function runAutoDelayDetection() {
  console.log("🚀 Auto delay detection started");

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log("📅 Today:", today.toISOString().slice(0, 10));
  console.log("📊 Rows loaded:", rows.length);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2; // sheet row (row 1 = header)

    const studentEmail = String(row["Student's Email"] || "").trim();
    const supervisorEmail = String(row["Main Supervisor's Email"] || "").trim();
    const studentName = String(row["Student Name"] || "").trim();

    if (!studentEmail) {
      console.log(`⏭️ Row ${rowIndex} skipped (no student email)`);
      continue;
    }

    console.log(`\n👤 Student [Row ${rowIndex}] ${studentEmail}`);

    const delays = [];

    for (const [activity, cols] of Object.entries(TIMELINE_MAP)) {
      const expectedRaw = row[cols.expected];
      const actualRaw = row[cols.actual];
      const delaySent = row[cols.sent];

      console.log(`🔍 ${activity}`);
      console.log("   Expected:", expectedRaw);
      console.log("   Actual  :", actualRaw);
      console.log("   Emailed :", delaySent);

      if (delaySent === "YES") {
        console.log("   📧 Already emailed → skip");
        continue;
      }

      const expectedDate = parseSheetDate(expectedRaw);
      if (!expectedDate) {
        console.log("   ❌ Invalid expected date → skip");
        continue;
      }

      expectedDate.setHours(0, 0, 0, 0);

      // 🔑 ONLY RULE YOU WANT:
      // Actual does NOT exist AND Today > Expected
      if (isEmptyCell(actualRaw) && expectedDate < today) {
        const daysLate = Math.floor(
          (today - expectedDate) / (1000 * 60 * 60 * 24)
        );

        console.log(`   ⏰ OVERDUE (${daysLate} days)`);

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
          today.toISOString().slice(0, 10)
        );

        delays.push({
          activity,
          remaining_days: daysLate
        });
      } else {
        console.log("   🟢 Not overdue or already completed");
      }
    }

    // 📧 Send ONE email per student
    if (delays.length > 0) {
      console.log(`📨 Sending delay email → ${studentEmail}`);

      if (supervisorEmail && supervisorEmail.includes("@")) {
        await sendDelayAlert({
          studentName,
          studentEmail,
          supervisorEmail,
          delays
        });
      } else {
        console.warn(
          `⚠️ Supervisor email missing for ${studentEmail}, email sent to student only`
        );
        await sendDelayAlert({
          studentName,
          studentEmail,
          supervisorEmail: undefined,
          delays
        });
      }
    } else {
      console.log("📭 No delays for this student");
    }
  }

  console.log("✅ Auto delay detection completed");
}
