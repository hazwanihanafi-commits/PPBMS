// frontend/utils/calcProgress.js
export function isDateValue(v) {
  if (!v) return false;
  const s = String(v).trim();
  if (!s) return false;
  if (["", "n/a", "na", "#n/a", "-", "—"].includes(s.toLowerCase())) return false;
  // basic YYYY-MM-DD check (loose)
  return /\d{4}-\d{2}-\d{2}/.test(s) || !isNaN(Date.parse(s));
}

export const MSC_PLAN = [
  "Development Plan & Learning Contract",
  "Proposal Defense Endorsed",
  "Pilot / Phase 1 Completed",
  "Phase 2 Data Collection Begun",
  "Annual Progress Review (Year 1)",
  "Phase 2 Data Collection Continued",
  "Seminar Completed",
  "Thesis Draft Completed",
  "Internal Evaluation Completed (Pre-Viva)",
  "Viva Voce",
  "Corrections Completed",
  "Final Thesis Submission"
];

export const PHD_PLAN = [
  "Development Plan & Learning Contract",
  "Proposal Defense Endorsed",
  "Pilot / Phase 1 Completed",
  "Annual Progress Review (Year 1)",
  "Phase 2 Completed",
  "Seminar Completed",
  "Data Analysis Completed",
  "1 Journal Paper Submitted",
  "Conference Presentation",
  "Annual Progress Review (Year 2)",
  "Thesis Draft Completed",
  "Internal Evaluation Completed (Pre-Viva)",
  "Viva Voce",
  "Corrections Completed",
  "Final Thesis Submission"
];

export function calculateProgressFromPlan(rawRow = {}, programme = "") {
  const isMsc = (programme || "").toLowerCase().includes("msc") || (programme || "").toLowerCase().includes("master");
  const plan = isMsc ? MSC_PLAN : PHD_PLAN;
  const items = plan.map((label) => {
    const key = label; // sheet/row keys are the full label strings
    const done = isDateValue(rawRow[key]);
    return { key, label, done };
  });
  const doneCount = items.filter(i => i.done).length;
  const total = items.length;
  const percentage = total ? Math.round((doneCount / total) * 100) : 0;
  return { items, doneCount, total, percentage };
}
