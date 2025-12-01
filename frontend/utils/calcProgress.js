// frontend/utils/calcProgress.js
export function isDone(val) {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  if (!s) return false;
  if (["", "n/a", "na", "#n/a", "-", "—"].includes(s)) return false;
  return true;
}

export const MSC_PLAN = [
  "Development Plan & Learning Contract - Actual",
  "Proposal Defense Endorsed - Actual",
  "Pilot / Phase 1 Completed - Actual",
  "Phase 2 Data Collection Begun - Actual",
  "Annual Progress Review (Year 1) - Actual",
  "Phase 2 Data Collection Continued - Actual",
  "Seminar Completed - Actual",
  "Thesis Draft Completed - Actual",
  "Internal Evaluation Completed Date",
  "Viva Voce - Actual",
  "Corrections Completed - Actual",
  "Final Thesis Submission - Actual"
];

export const PHD_PLAN = [
  "Development Plan & Learning Contract - Actual",
  "Proposal Defense Endorsed - Actual",
  "Pilot / Phase 1 Completed - Actual",
  "Annual Progress Review (Year 1) - Actual",
  "Phase 2 Data Collection Continued - Actual",
  "Seminar Completed - Actual",
  "Data Analysis Completed - Actual",
  "1 Journal Paper Submitted - Actual",
  "Conference Presentation - Actual",
  "Annual Progress Review (Year 2) - Actual",
  "Thesis Draft Completed - Actual",
  "Final Progress Review (Year 3) - Actual",
  "Viva Voce - Actual",
  "Corrections Completed - Actual",
  "Final Thesis Submission - Actual"
];

export function calculateProgressFromPlan(rawRow = {}, programme = "") {
  const isMsc = (programme || "").toLowerCase().includes("msc") || (programme || "").toLowerCase().includes("master");
  const plan = isMsc ? MSC_PLAN : PHD_PLAN;
  const done = plan.filter(k => isDone(rawRow[k])).length;
  const total = plan.length;
  const percentage = total ? Math.round((done / total) * 100) : 0;
  return { done, total, percentage };
}
