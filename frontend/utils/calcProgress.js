// utils/calcProgress.js

// ----------------------------------------------------------------------
//  Helper: check if a submission/tick is considered "done"
// ----------------------------------------------------------------------
export function isTicked(rawRow, key) {
  if (!rawRow) return false;
  const v = rawRow[key];

  if (!v) return false;

  const s = String(v).trim().toLowerCase();

  if (!s) return false;
  if (["", "n/a", "na", "#n/a", "-", "—"].includes(s)) return false;

  return true;
}


// ----------------------------------------------------------------------
//  MSc PLAN (16 items)
// ----------------------------------------------------------------------
export const MSC_PLAN = [
  { key: "Development Plan & Learning Contract", label: "Development Plan & Learning Contract", mandatory: true },
  { key: "Master Research Timeline (Gantt)", label: "Master Research Timeline (Gantt)", mandatory: false },
  { key: "Research Logbook (Weekly)", label: "Research Logbook (Weekly)", mandatory: false },
  { key: "Proposal Defense Endorsed", label: "Proposal Defense Endorsed", mandatory: true },
  { key: "Pilot / Phase 1 Completed", label: "Pilot / Phase 1 Completed", mandatory: true },
  { key: "Phase 2 Data Collection Begun", label: "Phase 2 Data Collection Begun", mandatory: true },
  { key: "Annual Progress Review (Year 1)", label: "Annual Progress Review (Year 1)", mandatory: true },
  { key: "Phase 2 Data Collection Continued", label: "Phase 2 Data Collection Continued", mandatory: true },
  { key: "Seminar Completed", label: "Seminar Completed", mandatory: true },
  { key: "Thesis Draft Completed", label: "Thesis Draft Completed", mandatory: true },
  { key: "Internal Evaluation Completed", label: "Internal Evaluation Completed", mandatory: true },
  { key: "Viva Voce", label: "Viva Voce", mandatory: true },
  { key: "Corrections Completed", label: "Corrections Completed", mandatory: true },
  { key: "Final Thesis Submission", label: "Final Thesis Submission", mandatory: true }
];


// ----------------------------------------------------------------------
//  PhD PLAN (same structure — 17 items)
// ----------------------------------------------------------------------
export const PHD_PLAN = [
  { key: "Development Plan & Learning Contract", label: "Development Plan & Learning Contract", mandatory: true },
  { key: "Master Research Timeline (Gantt)", label: "Master Research Timeline (Gantt)", mandatory: false },
  { key: "Research Logbook (Weekly)", label: "Research Logbook (Weekly)", mandatory: false },
  { key: "Proposal Defense Endorsed", label: "Proposal Defense Endorsed", mandatory: true },
  { key: "Pilot / Phase 1 Completed", label: "Pilot / Phase 1 Completed", mandatory: true },
  { key: "Annual Progress Review (Year 1)", label: "Annual Progress Review (Year 1)", mandatory: true },
  { key: "Phase 2 Completed", label: "Phase 2 Completed", mandatory: true },
  { key: "Seminar Completed", label: "Seminar Completed", mandatory: true },
  { key: "Data Analysis Completed", label: "Data Analysis Completed", mandatory: true },
  { key: "1 Journal Paper Submitted", label: "1 Journal Paper Submitted", mandatory: true },
  { key: "Conference Presentation", label: "Conference Presentation", mandatory: true },
  { key: "Annual Progress Review (Year 2)", label: "Annual Progress Review (Year 2)", mandatory: true },
  { key: "Thesis Draft Completed", label: "Thesis Draft Completed", mandatory: true },
  { key: "Internal Evaluation Completed", label: "Internal Evaluation Completed", mandatory: true },
  { key: "Viva Voce", label: "Viva Voce", mandatory: true },
  { key: "Corrections Completed", label: "Corrections Completed", mandatory: true },
  { key: "Final Thesis Submission", label: "Final Thesis Submission", mandatory: true }
];


// ----------------------------------------------------------------------
//  MAIN CALCULATOR — RETURNS percentage, done list, total list
// ----------------------------------------------------------------------
export function calculateProgress(rawRow, programmeText) {
  const isMsc = programmeText.toLowerCase().includes("msc") ||
                programmeText.toLowerCase().includes("master");

  const plan = isMsc ? MSC_PLAN : PHD_PLAN;

  const doneCount = plan.filter(i => isTicked(rawRow, i.key)).length;
  const total = plan.length;

  const percentage = Math.round((doneCount / total) * 100);

  // Return full breakdown for table
  const itemsWithStatus = plan.map(i => ({
    ...i,
    done: isTicked(rawRow, i.key)
  }));

  return {
    percentage,
    done: doneCount,
    total,
    items: itemsWithStatus
  };
}
