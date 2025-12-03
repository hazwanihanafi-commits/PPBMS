// backend/cron/expectedTimeline.js

import {
  readMasterTracking,
  writeStudentActual
} from "../services/googleSheets.js";

/* -----------------------------------------------
   DATE PARSER (Robust for dd/mm/yyyy, yyyy-mm-dd)
-------------------------------------------------*/
function parseDateString(dateStr) {
  if (!dateStr) return null;
  dateStr = dateStr.toString().trim();

  // ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T00:00:00");
  }

  // dd/mm/yyyy OR d/m/yyyy
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    let [d, m, y] = dateStr.split("/").map(Number);
    return new Date(y, m - 1, d);
  }

  // fallback (rare)
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/* -----------------------------------------------
   Add Months → return ISO yyyy-mm-dd
-------------------------------------------------*/
function addMonthsStr(dateStr, months) {
  const d = parseDateString(dateStr);
  if (!d) return "";

  const newDate = new Date(d);
  newDate.setMonth(newDate.getMonth() + months);

  const yyyy = newDate.getFullYear();
  const mm = String(newDate.getMonth() + 1).padStart(2, "0");
  const dd = String(newDate.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

/* -----------------------------------------------
   Timeline Mapping
-------------------------------------------------*/
const MSC_MAPPING = {
  "Development Plan & Learning Contract": 0,
  "Proposal Defense Endorsed": 6,
  "Pilot / Phase 1 Completed": 9,
  "Phase 2 Data Collection Begun": 12,
  "Annual Progress Review (Year 1)": 12,
  "Phase 2 Data Collection Continued": 18,
  "Seminar Completed": 18,
  "Annual Progress Review (Year 2)": 24,
  "Thesis Draft Completed": 26,
  "Final Progress Review (Year 3)": 30,
  "Viva Voce": 32,
  "Corrections Completed": 33,
  "Final Thesis Submission": 36
};

const PHD_MAPPING = {
  "Development Plan & Learning Contract": 0,
  "Proposal Defense Endorsed": 6,
  "Pilot / Phase 1 Completed": 9,
  "Phase 2 Data Collection Begun": 12,
  "Annual Progress Review (Year 1)": 12,
  "Phase 2 Data Collection Continued": 18,
  "Seminar Completed": 18,
  "Annual Progress Review (Year 2)": 24,
  "Thesis Draft Completed": 30,
  "Annual Progress Review (Year 3)": 30,
  "Viva Voce": 36,
  "Corrections Completed": 38,
  "Final Thesis Submission": 42
};

/* -----------------------------------------------
   MAIN: generateExpectedTimeline()
-------------------------------------------------*/
export async function generateExpectedTimeline() {
  const rows = await readMasterTracking(process.env.SHEET_ID);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const start = row["Start Date"];
    if (!start) continue;

    const rowNumber = i + 2; // row 1 header
    const programme = (row["Programme"] || "").toLowerCase();

    const mapping =
      programme.includes("phd") || programme.includes("doctor")
        ? PHD_MAPPING
        : MSC_MAPPING;

    for (const activity of Object.keys(mapping)) {
      const expectedCol = `Exp: ${activity}`;
      const expectedDate = addMonthsStr(start, mapping[activity]);

      try {
        await writeStudentActual(
          process.env.SHEET_ID,
          rowNumber,
          expectedCol,
          null,
          expectedDate,
          null
        );
      } catch (e) {
        console.warn(`Column ${expectedCol} not found:`, e.message);
      }
    }
  }

  console.log("✔ Expected timeline updated for all students");
}
