// backend/utils/buildTimeline.js

// -----------------------------------------------
// FIXED — EXPORTS BOTH FUNCTIONS CLEANLY
// -----------------------------------------------

// MSc + PhD activities (same list; sheet provides actual dates)
export const ACTIVITIES = [
  { key: "Development Plan & Learning Contract", months: 2 },
  { key: "Proposal Defense Endorsed", months: 12 },
  { key: "Pilot / Phase 1 Completed", months: 18 },
  { key: "Phase 2 Data Collection Begun", months: 20 },
  { key: "Annual Progress Review (Year 1)", months: 12 },
  { key: "Phase 2 Data Collection Continued", months: 24 },
  { key: "Seminar Completed", months: 26 },
  { key: "Data Analysis Completed", months: 30 },
  { key: "1 Journal Paper Submitted", months: 30 },
  { key: "Conference Presentation", months: 32 },
  { key: "Annual Progress Review (Year 2)", months: 24 },
  { key: "Thesis Draft Completed", months: 36 },
  { key: "Final Progress Review (Year 3)", months: 40 },
  { key: "Viva Voce", months: 42 },
  { key: "Corrections Completed", months: 44 },
  { key: "Final Thesis Submission", months: 48 }
];

/** Utility */
function addMonths(date, num) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + num);
  return d;
}
function daysBetween(a, b) {
  return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * -----------------------------------------------------
 * MAIN ENGINE — builds timeline for one student row
 * -----------------------------------------------------
 */
export function buildTimelineForRow(raw) {
  const start = new Date(raw["Start Date"]);
  const today = new Date();

  const timeline = ACTIVITIES.map((act) => {
    const expected = addMonths(start, act.months).toISOString().slice(0, 10);

    const actualKey = `${act.key} - Actual`;
    const actual = raw[actualKey] || "";

    let status = "Pending";
    let remaining = "";

    if (actual) {
      status = "Completed";
      remaining = "0";
    } else {
      if (new Date(expected) < today) {
        status = "Late";
        remaining = daysBetween(new Date(expected), today) * -1; // overdue
      } else {
        status = "On Track";
        remaining = daysBetween(today, new Date(expected)); // days left
      }
    }

    return {
      activity: act.key,
      expected,
      actual,
      status,
      remaining
    };
  });

  return timeline;
}

/**
 * -----------------------------------------------------
 * SUPERVISOR VIEW WRAPPER
 * -----------------------------------------------------
 */
export function buildTimeline(raw) {
  return buildTimelineForRow(raw);
}
