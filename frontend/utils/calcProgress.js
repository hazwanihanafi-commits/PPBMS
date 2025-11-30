// utils/calcProgress.js

// A: Define activities for MSc
export const MSC_ITEMS = [
  { key: "Development Plan & Learning Contract", optional: false },
  { key: "Master Research Timeline (Gantt)", optional: true },
  { key: "Research Logbook (Weekly)", optional: true },
  { key: "Proposal Defense Endorsed", optional: false },
  { key: "Pilot / Phase 1 Completed", optional: false },
  { key: "Phase 2 Data Collection Begun", optional: false },
  { key: "Annual Progress Review (Year 1)", optional: false },
  { key: "Phase 2 Data Collection Continued", optional: false },
  { key: "Seminar Completed", optional: false },
  { key: "Thesis Draft Completed", optional: false },
  { key: "Internal Evaluation Completed", optional: false },   // REQUIRED
  { key: "Viva Voce", optional: false },
  { key: "Corrections Completed", optional: false },
  { key: "Final Thesis Submission", optional: false },
];

// B: Define activities for PhD
export const PHD_ITEMS = [
  { key: "Development Plan & Learning Contract", optional: false },
  { key: "Master Research Timeline (Gantt)", optional: true },
  { key: "Research Logbook (Weekly)", optional: true },
  { key: "Proposal Defense Endorsed", optional: false },
  { key: "Pilot / Phase 1 Completed", optional: false },
  { key: "Annual Progress Review (Year 1)", optional: false },
  { key: "Phase 2 Completed", optional: false },
  { key: "Seminar Completed", optional: false },
  { key: "Data Analysis Completed", optional: false },
  { key: "1 Journal Paper Submitted", optional: false },
  { key: "Conference Presentation", optional: false },
  { key: "Annual Progress Review (Year 2)", optional: false },
  { key: "Thesis Draft Completed", optional: false },
  { key: "Internal Evaluation Completed", optional: false },   // REQUIRED
  { key: "Viva Voce", optional: false },
  { key: "Corrections Completed", optional: false },
  { key: "Final Thesis Submission", optional: false },
];

// ---------- Helper: Determine if activity is ticked ----------
function isTicked(rawRow, key) {
  const v = rawRow?.[key];
  if (!v) return false;
  const t = String(v).trim().toLowerCase();
  if (!t || ["", "n/a", "na", "-", "—", "#n/a"].includes(t)) return false;
  return true;
}

// ---------- MAIN FUNCTION ----------
export function calculateProgressFromPlan(rawRow, programme) {
  const plan = programme.includes("phd") ? PHD_ITEMS : MSC_ITEMS;

  const totalRequired = plan.filter(p => !p.optional).length;
  const doneRequired = plan.filter(p => !p.optional && isTicked(rawRow, p.key)).length;

  const percentage = Math.round((doneRequired / totalRequired) * 100);

  const itemsWithStatus = plan.map(i => ({
    ...i,
    done: isTicked(rawRow, i.key),
  }));

  return {
    done: doneRequired,
    total: totalRequired,
    percentage,
    items: itemsWithStatus,
  };
}
