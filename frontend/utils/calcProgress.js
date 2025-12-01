// utils/calcProgress.js

export const MSC_PLAN = [
  { key: "Development Plan & Learning Contract", label: "Development Plan & Learning Contract", mandatory: true },
  { key: "Proposal Defense Endorsed", label: "Proposal Defense Endorsed", mandatory: false },
  { key: "Pilot / Phase 1 Completed", label: "Pilot / Phase 1 Completed", mandatory: false },
  { key: "Phase 2 Data Collection Begun", label: "Phase 2 Data Collection Begun", mandatory: false },
  { key: "Annual Progress Review (Year 1)", label: "Annual Progress Review (Year 1)", mandatory: true },
  { key: "Phase 2 Data Collection Continued", label: "Phase 2 Data Collection Continued", mandatory: false },
  { key: "Seminar Completed", label: "Seminar Completed", mandatory: false },
  { key: "Thesis Draft Completed", label: "Thesis Draft Completed", mandatory: false },
  { key: "Internal Evaluation Completed", label: "Internal Evaluation Completed", mandatory: true },
  { key: "Viva Voce", label: "Viva Voce", mandatory: false },
  { key: "Corrections Completed", label: "Corrections Completed", mandatory: false },
  { key: "Final Thesis Submission", label: "Final Thesis Submission", mandatory: true }
];

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
  { key: "Internal Evaluation Completed", label: "Internal Evaluation Completed", mandatory: true },
  { key: "Viva Voce", label: "Viva Voce", mandatory: false },
  { key: "Corrections Completed", label: "Corrections Completed", mandatory: false },
  { key: "Final Thesis Submission", label: "Final Thesis Submission", mandatory: true }
];

export function isTicked(rawRow, key) {
  if (!rawRow) return false;
  const v = rawRow[key] || rawRow[`${key} Submitted`] || rawRow[`${key} StudentTickDate`];
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  if (!s) return false;
  if (["", "n/a", "na", "#n/a", "-", "—", "false"].includes(s)) return false;
  return true;
}

/**
 * given raw row (sheet) and plan list, return { done, total, percentage, items[] }
 */
export function calculateProgressFromPlan(rawRow, planList) {
  const plan = planList || (rawRow.programme && rawRow.programme.toLowerCase().includes("msc") ? MSC_PLAN : PHD_PLAN);
  const itemsWith = plan.map(i => ({ ...i, done: isTicked(rawRow, i.key) }));
  const done = itemsWith.filter(i => i.done).length;
  const total = itemsWith.length;
  const percentage = Math.round((done / total) * 100);
  return { done, total, percentage, items: itemsWith };
}

/**
 * expectedDatesFromStart(startDateString, isMsc)
 * returns map { key: 'YYYY-MM-DD' } computed from start date offsets (months)
 * NOTE: these offsets are configurable here.
 */
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0,10);
}

export function expectedDatesFromStart(startDateString, isMsc=true) {
  const start = startDateString ? new Date(startDateString) : null;
  const map = {};
  // define month offsets for MSc (2 years) and PhD (3 years)
  // offsets are approximate and you can tune them
  const base = isMsc ? {
    "Development Plan & Learning Contract": 0,
    "Proposal Defense Endorsed": 6,
    "Pilot / Phase 1 Completed": 9,
    "Phase 2 Data Collection Begun": 12,
    "Annual Progress Review (Year 1)": 12,
    "Phase 2 Data Collection Continued": 15,
    "Seminar Completed": 18,
    "Thesis Draft Completed": 18,
    "Internal Evaluation Completed": 21,
    "Viva Voce": 22,
    "Corrections Completed": 23,
    "Final Thesis Submission": 24
  } : {
    "Development Plan & Learning Contract": 0,
    "Proposal Defense Endorsed": 9,
    "Pilot / Phase 1 Completed": 12,
    "Annual Progress Review (Year 1)": 12,
    "Phase 2 Completed": 24,
    "Seminar Completed": 24,
    "Data Analysis Completed": 30,
    "1 Journal Paper Submitted": 30,
    "Conference Presentation": 30,
    "Annual Progress Review (Year 2)": 24,
    "Thesis Draft Completed": 36,
    "Internal Evaluation Completed": 38,
    "Viva Voce": 39,
    "Corrections Completed": 40,
    "Final Thesis Submission": 42
  };

  Object.keys(base).forEach(k => {
    map[k] = start ? addMonths(start, base[k]) : "";
  });

  return map;
}
