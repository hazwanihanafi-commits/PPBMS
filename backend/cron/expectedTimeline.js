import { readMasterTracking, writeToSheet } from "../services/googleSheets.js";

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

    const rowNumber = i + 2;

    Object.keys(MSC_MAPPING).forEach(async (key) => {
      const expectedCol = `Exp: ${key}`;
      const expectedDate = addMonths(start, MSC_MAPPING[key]);
      await writeToSheet(
        process.env.SHEET_ID,
        "MasterTracking",
        rowNumber,
        expectedCol,
        expectedDate
      );
    });
  }

  console.log("Expected timeline updated!");
}
