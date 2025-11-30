// frontend/utils/calcProgress.js
export function isTicked(rawRow, key) {
  if (!rawRow) return false;
  const v = rawRow[key];
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  if (!s) return false;
  if (["", "n/a", "na", "#n/a", "-", "—"].includes(s)) return false;
  return true;
}

// Simplified MSc & PhD plan (no logbook)
export const MSC_PLAN = [
  "Development Plan & Learning Contract",
  "Proposal Defense Endorsed",
  "Pilot / Phase 1 Completed",
  "Phase 2 Data Collection Begun",
  "Annual Progress Review (Year 1)",
  "Phase 2 Data Collection Continued",
  "Seminar Completed",
  "Data Analysis Completed",
  "1 Journal Paper Submitted",
  "Conference Presentation",
  "Annual Progress Review (Year 2)",
  "Thesis Draft Completed",
  "Internal Evaluation Completed",
  "Viva Voce",
  "Corrections Completed",
  "Final Thesis Submission",
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
  "Internal Evaluation Completed",
  "Viva Voce",
  "Corrections Completed",
  "Final Thesis Submission",
];

// Convert date string to Date (safe)
function toDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return dt;
}
function addMonths(d, months) {
  const dt = new Date(d);
  dt.setMonth(dt.getMonth() + months);
  return dt;
}
function fmt(d) {
  if (!d) return "—";
  const dt = toDate(d);
  if (!dt) return "—";
  return dt.toISOString().slice(0, 10);
}

// Build expected dates based on start date & programme
export function buildExpectedDates(startDate, programme) {
  const s = toDate(startDate) || new Date();
  const isMsc = (programme || "").toLowerCase().includes("msc") || (programme || "").toLowerCase().includes("master");

  const mappingMsc = {
    "Development Plan & Learning Contract": 0,
    "Proposal Defense Endorsed": 6,
    "Pilot / Phase 1 Completed": 9,
    "Phase 2 Data Collection Begun": 10,
    "Annual Progress Review (Year 1)": 12,
    "Phase 2 Data Collection Continued": 15,
    "Seminar Completed": 18,
    "Data Analysis Completed": 18,
    "1 Journal Paper Submitted": 18,
    "Conference Presentation": 20,
    "Annual Progress Review (Year 2)": 24,
    "Thesis Draft Completed": 24,
    "Internal Evaluation Completed": 26,
    "Viva Voce": 27,
    "Corrections Completed": 28,
    "Final Thesis Submission": 30,
  };

  const mappingPhd = {
    "Development Plan & Learning Contract": 0,
    "Proposal Defense Endorsed": 12,
    "Pilot / Phase 1 Completed": 18,
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
    "Final Thesis Submission": 42,
  };

  const mapping = isMsc ? mappingMsc : mappingPhd;

  const expected = {};
  Object.keys(mapping).forEach((k) => {
    expected[k] = fmt(addMonths(s, mapping[k]));
  });
  return expected;
}

export function statusAndRemaining(expectedDateStr, actualDateStr) {
  const expected = toDate(expectedDateStr);
  const actual = toDate(actualDateStr);
  const today = new Date();

  if (actual) {
    return { status: "Completed", remaining: "—" };
  }
  if (!expected) return { status: "No target", remaining: "—" };

  const diffMs = expected - today;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) return { status: "Delayed", remaining: `${Math.abs(days)}d overdue` };
  if (days <= 14) return { status: "Due soon", remaining: `${days}d` };

  return { status: "On track", remaining: `${days}d` };
}

// Main engine
export function calculateProgressWithTimeline(rawRow = {}, programme = "", startDate = null) {
  const plan = (programme || "").toLowerCase().includes("msc") || (programme || "").toLowerCase().includes("master")
    ? MSC_PLAN
    : PHD_PLAN;

  const expected = buildExpectedDates(startDate, programme);

  const items = plan.map((key) => {
    const actual = rawRow?.[key] || rawRow?.[`${key} Date`] || "";
    const done = isTicked(rawRow, key);
    const { status, remaining } = statusAndRemaining(expected[key], actual);
    return { key, label: key, expected: expected[key] || "—", actual: actual || "—", done, status, remaining };
  });

  const doneCount = items.filter(i => i.done && i.status === "Completed").length;
  const total = items.length;
  const percentage = total ? Math.round((doneCount / total) * 100) : 0;

  return { items, doneCount, total, percentage };
}

// ⭐ Compatibility export (this fixes your crash)
export function calculateProgress(rawRow, programme, startDate = null) {
  return calculateProgressWithTimeline(rawRow, programme, startDate);
}
