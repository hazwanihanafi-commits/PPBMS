import { parseAcademicDate, academicToday } from "../utils/academicDate.js";
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
  // 🔒 ENV SAFETY SWITCH
  if (process.env.AUTO_DELAY_DETECTION !== "true") {
    console.log("⛔ Auto delay detection disabled by env flag");
    return;
  }

  console.log("🚀 Auto delay detection started");

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const todayISO = academicToday();
  const today = new Date(`${todayISO}T00:00:00Z`);

  console.log("📅 Today:", today.toISOString().slice(0, 10));
  console.log("📊 Rows loaded:", rows.length);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2; // sheet row (row 1 = header)

    const studentEmail = String(row["Student's Email"] || "").trim();
const supervisorEmail = String(row["Main Supervisor's Email"] || "").trim();
const studentName = String(row["Student Name"] || "").trim();
const studentStatus = String(row["Status"] || "").trim();

    if (!studentEmail) {
      console.log(`⏭️ Row ${rowIndex} skipped (no student email)`);
      continue;
    }

    console.log(`\n👤 Student [Row ${rowIndex}] ${studentEmail}`);

    const startISO = parseAcademicDate(row["Start Date"]);
    if (!startISO) {
      console.warn(`⚠️ Row ${rowIndex}: missing/invalid Start Date; delay alerts suppressed`);
      continue;
    }
    if (startISO > todayISO) continue;
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

      const expectedISO = parseAcademicDate(expectedRaw);
      if (!expectedISO || expectedISO < startISO) {
        console.warn(`⚠️ Row ${rowIndex}: expected date predates commencement; alert suppressed for ${activity}`);
        continue;
      }
      expectedDate.setTime(new Date(`${expectedISO}T00:00:00Z`).getTime());

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
  cols.sent,
  rowIndex,
  "YES"
);

         await writeSheetCell(
  process.env.SHEET_ID,
  "MasterTracking",
  cols.date,
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
  studentStatus,
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
  studentStatus,
  delays
});
      }
    } else {
      console.log("📭 No delays for this student");
    }
  }

  console.log("✅ Auto delay detection completed");
}
