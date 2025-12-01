// backend/utils/buildTimeline.js

// -----------------------------------------------
// SEPARATED ACTIVITY LISTS FOR MSc & PhD
// -----------------------------------------------

// ---------- MSc (2–3 years typical) ----------
export const MSC_ACTIVITIES = [
  { key: "Development Plan & Learning Contract", months: 1 },
  { key: "Proposal Defense Endorsed", months: 6 },
  { key: "Pilot / Phase 1 Completed", months: 9 },
  { key: "Data Collection Completed", months: 12 },
  { key: "Annual Progress Review (Year 1)", months: 12 },
  { key: "Seminar Completed", months: 18 },
  { key: "Thesis Draft Completed", months: 21 },
  { key: "Final Year Review / Internal Evaluation (Pre-Viva)", months: 20 },
  { key: "Viva Voce", months: 24 },
  { key: "Corrections Completed", months: 25 },
  { key: "Final Thesis Submission", months: 26 }
];

// ---------- PhD (3–4 years typical) ----------
export const PHD_ACTIVITIES = [
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
  { key: "Final Year Review / Internal Evaluation (Pre-Viva)", months: 38 },
  { key: "Viva Voce", months: 42 },
  { key: "Corrections Completed", months: 44 },
  { key: "Final Thesis Submission", months: 48 }
];


// -----------------------------------------------------
// 3. PROGRAMME DETECTION — FIXED (Doctor of Philosophy → PhD)
// -----------------------------------------------------
function detectLevel(raw) {
  const prog = (raw["Programme"] || "").toLowerCase();

  // MSc ONLY if explicitly stated
  if (
    prog.includes("master") ||
    prog.includes("msc") ||
    prog.includes("m.sc")
  ) {
    return "MSc";
  }

  // EVERYTHING ELSE becomes PhD (Doctor of Philosophy)
  return "PhD";
}


// -----------------------------------------------------
// Utility Functions
// -----------------------------------------------------
function addMonths(date, num) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + num);
  return d;
}

function daysBetween(a, b) {
  return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
}


// -----------------------------------------------------
// 4. MAIN TIMELINE ENGINE (one row)
// -----------------------------------------------------
export function buildTimelineForRow(raw) {
  const level = detectLevel(raw);
  const start = new Date(raw["Start Date"]);
  const today = new Date();

  const activities = level === "PhD" ? PHD_ACTIVITIES : MSC_ACTIVITIES;

  return activities.map((act) => {
    const expected = addMonths(start, act.months).toISOString().slice(0, 10);
    const actual = raw[`${act.key} - Actual`] || "";

    let status = "Pending";
    let remaining = "";

    if (actual) {
      status = "Completed";
      remaining = 0;
    } else {
      if (new Date(expected) < today) {
        status = "Late";
        remaining = daysBetween(new Date(expected), today) * -1;
      } else {
        status = "On Track";
        remaining = daysBetween(today, new Date(expected));
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
}


// -----------------------------------------------------
// 5. Export Wrapper
// -----------------------------------------------------
export function buildTimeline(raw) {
  return buildTimelineForRow(raw);
}
