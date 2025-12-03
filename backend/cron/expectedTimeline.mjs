import { readMasterTracking, writeStudentActual } from "../services/googleSheets.js";

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

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export async function generateExpectedTimeline() {
  const rows = await readMasterTracking(process.env.SHEET_ID);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const start = row["Start Date"];
    if (!start) continue;

    const programme = (row["Programme"] || "").toLowerCase();
    const rowNumber = i + 2;

    // Choose mapping based on programme
    const mapping =
      programme.includes("phd") || programme.includes("doctor")
        ? PHD_MAPPING
        : MSC_MAPPING;

    for (const key of Object.keys(mapping)) {
      const expectedCol = `Exp: ${key}`;
      const expectedDate = addMonths(start, mapping[key]);

      await writeStudentActual(
        process.env.SHEET_ID,
        rowNumber,
        expectedCol,   // writing expected date as ActualColumn
        null,
        expectedDate,  // value to write
        null           // no URL
      );
    }
  }

  console.log("Expected timeline updated!");
}
