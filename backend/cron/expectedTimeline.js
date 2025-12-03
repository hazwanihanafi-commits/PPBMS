import { readMasterTracking, writeStudentActual } from "../services/googleSheets.js";

/**
 * 1. MAPPINGS for Expected Timelines
 * MSc = 24–36 months
 * PhD = 36–48 months
 */
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

/** Add N months to yyyy-mm-dd */
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * Generate Expected Timeline for ALL Students
 * Writes:
 *   Exp: Activity → yyyy-mm-dd
 */
export async function generateExpectedTimeline() {
  const rows = await readMasterTracking(process.env.SHEET_ID);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const start = row["Start Date"];
    if (!start) continue;

    const programme = (row["Programme"] || "").toLowerCase();

    const rowNumber = i + 2; // +2 because row 1 = header, row 2 = first student

    // Select MSc or PhD mapping automatically
    const mapping =
      programme.includes("phd") || programme.includes("doctor")
        ? PHD_MAPPING
        : MSC_MAPPING;

    for (const activity of Object.keys(mapping)) {
      const expectedColumn = `Exp: ${activity}`;
      const expectedDate = addMonths(start, mapping[activity]);

      try {
        await writeStudentActual(
          process.env.SHEET_ID,
          rowNumber,
          expectedColumn, // write under Exp: ...
          null,           // no FileURL for expected timeline
          expectedDate,   // yyyy-mm-dd
          null
        );
      } catch (err) {
        console.warn(
          `Warning: Column "${expectedColumn}" not found for row ${rowNumber}:`,
          err.message
        );
      }
    }
  }

  console.log("✅ Expected timeline updated for all students");
}
