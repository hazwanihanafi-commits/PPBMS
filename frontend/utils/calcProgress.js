// frontend/utils/calcProgress.js

// helper: consider a value "ticked" if non-empty and not garbage
export function isTicked(rawRow, key) {
  if (!rawRow) return false;
  const v = rawRow[key];
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  if (!s) return false;
  if (["", "n/a", "na", "#n/a", "-", "—"].includes(s)) return false;
  return true;
}

// MSc plan (14 items) - ordered
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

// PhD plan (17 items)
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

// calculate progress by selecting plan based on programme text
export function calculateProgress(rawRow = {}, programmeText = "") {
  const prog = (programmeText || "").toLowerCase();
  const plan = prog.includes("msc") || prog.includes("master") ? MSC_PLAN : PHD_PLAN;

  const items = plan.map(it => ({ ...it, done: isTicked(rawRow, it.key) }));
  const doneCount = items.filter(i => i.done).length;
  const total = items.length;
  const percentage = total ? Math.round((doneCount / total) * 100) : 0;

  return { percentage, doneCount, total, items };
}
