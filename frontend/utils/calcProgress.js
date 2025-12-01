// frontend/utils/calcProgress.js
export function isTicked(rawRow = {}, key) {
  if (!rawRow) return false;
  const v = rawRow[key];
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  if (!s) return false;
  if (["", "n/a", "na", "#n/a", "-", "—"].includes(s)) return false;
  return true;
}

// MSc plan
export const MSC_PLAN = [
  { key: "Development Plan & Learning Contract", label: "Development Plan & Learning Contract", mandatory: true },
  { key: "Proposal Defense Endorsed", label: "Proposal Defense Endorsed", mandatory: false },
  { key: "Pilot / Phase 1 Completed", label: "Pilot / Phase 1 Completed", mandatory: false },
  { key: "Phase 2 Data Collection Begun", label: "Phase 2 Data Collection Begun", mandatory: false },
  { key: "Annual Progress Review (Year 1)", label: "Annual Progress Review (Year 1)", mandatory: true },
  { key: "Phase 2 Data Collection Continued", label: "Phase 2 Data Collection Continued", mandatory: false },
  { key: "Seminar Completed", label: "Seminar Completed", mandatory: false },
  { key: "Thesis Draft Completed", label: "Thesis Draft Completed", mandatory: false },
  { key: "Internal Evaluation Completed (Pre-Viva)", label: "Internal Evaluation Completed (Pre-Viva)", mandatory: true },
  { key: "Viva Voce", label: "Viva Voce", mandatory: false },
  { key: "Corrections Completed", label: "Corrections Completed", mandatory: false },
  { key: "Final Thesis Submission", label: "Final Thesis Submission", mandatory: true },
];

// PhD plan
export const PHD_PLAN = [
  { key: "Development Plan & Learning Contract", label: "Development Plan & Learning Contract", mandatory: true },
  { key: "Proposal Defense Endorsed", label: "Proposal Defense Endorsed", mandatory: false },
  { key: "Pilot / Phase 1 Completed", label: "Pilot / Phase 1 Completed", mandatory: false },
  { key: "Annual Progress Review (Year 1)", label: "Annual Progress Review (Year 1)", mandatory: true },
  { key: "Phase 2 Completed", label: "Phase 2 Completed", mandatory: false },
  { key: "Seminar Completed", label: "Seminar Completed", mandatory: false },
  { key: "Data Analysis Completed", label: "Data Analysis Completed", mandatory: false },
  { key: "1 Journal Paper Submitted", label: "1 Journal Paper Submitted", mandatory: false },
  { key: "Conference Presentation", label: "Conference Presentation", mandatory: false },
  { key: "Annual Progress Review (Year 2)", label: "Annual Progress Review (Year 2)", mandatory: true },
  { key: "Thesis Draft Completed", label: "Thesis Draft Completed", mandatory: false },
  { key: "Internal Evaluation Completed (Pre-Viva)", label: "Internal Evaluation Completed (Pre-Viva)", mandatory: true },
  { key: "Viva Voce", label: "Viva Voce", mandatory: false },
  { key: "Corrections Completed", label: "Corrections Completed", mandatory: false },
  { key: "Final Thesis Submission", label: "Final Thesis Submission", mandatory: true },
];

// returns { percentage, doneCount, total, items }
export function calculateProgress(rawRow = {}, programmeText = "") {
  const lower = (programmeText || "").toLowerCase();
  const plan = (lower.includes("msc") || lower.includes("master")) ? MSC_PLAN : PHD_PLAN;
  const items = plan.map(it => ({ ...it, done: isTicked(rawRow, it.key), actual: rawRow[it.key] || "" }));
  const doneCount = items.filter(i => i.done).length;
  const total = items.length;
  const percentage = total ? Math.round((doneCount / total) * 100) : 0;
  return { percentage, doneCount, total, items };
}
