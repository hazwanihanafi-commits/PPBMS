// -----------------------------------------------
// SEPARATED ACTIVITY LISTS FOR MSc & PhD
// -----------------------------------------------

// ---------- MSc (2 years) ----------
export const MSC_ACTIVITIES = [
  { key: "Development Plan & Learning Contract", months: 1 },
  { key: "Proposal Defense Endorsed", months: 6 },
  { key: "Pilot / Phase 1 Completed", months: 9 },
  { key: "Data Collection Completed", months: 12 },
  { key: "Annual Progress Review (Year 1)", months: 12 },

  // Seminar FIRST
  { key: "Seminar Completed", months: 18 },

  // Final Review SECOND
  { key: "Final Year Review / Internal Evaluation (Pre-Viva)", months: 20 },

  { key: "Thesis Draft Completed", months: 22 },
  { key: "Viva Voce", months: 24 },
  { key: "Corrections Completed", months: 25 },
  { key: "Final Thesis Submission", months: 26 }
];

// ---------- PhD (3–4 years) ----------
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

  // Your required final evaluation
  { key: "Final Year Review / Internal Evaluation (Pre-Viva)", months: 38 },

  { key: "Viva Voce", months: 42 },
  { key: "Corrections Completed", months: 44 },
  { key: "Final Thesis Submission", months: 48 }
];

// -----------------------------------------------------
// PROGRAMME DETECTION (Doctor of Philosophy → PhD)
// -----------------------------------------------------
function detectLevel(raw) {
  const p = (raw["Programme"] || "").toLowerCase();

  if (p.includes("master") || p.includes("msc") || p.includes("m.sc")) {
    return "MSc";
  }
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
// Find ACTUAL date (supports many column formats)
// -----------------------------------------------------
function getActual(raw, actKey) {
  const candidates = [
    `${actKey} - Actual`,
    `${actKey} - actual`,
    `${actKey} Actual`,
    `${actKey} (Actual)`,
    `${actKey} Date`,
    `${actKey} Completed`
  ];

  for (const key of candidates) {
    if (raw[key]) return raw[key];
  }

  // SPECIAL: backward compatibility for old sheets
  if (actKey === "Final Year Review / Internal Evaluation (Pre-Viva)") {
    return raw["Final Progress Review (Year 3) - Actual"] || "";
  }

  return "";
}

// -----------------------------------------------------
// MAIN TIMELINE ENGINE
// -----------------------------------------------------
export function buildTimelineForRow(raw) {
  const level = detectLevel(raw);
  const activities = level === "PhD" ? PHD_ACTIVITIES : MSC_ACTIVITIES;

  const startDate = new Date(raw["Start Date"]);
  const today = new Date();

  return activities.map((act) => {
    const expected = addMonths(startDate, act.months)
      .toISOString()
      .slice(0, 10);

    const actual = getActual(raw, act.key);

    let status = "Pending";
    let remaining = "";

    if (actual) {
      status = "Completed";
      remaining = 0;
    } else {
      if (new Date(expected) < today) {
        status = "Late";
        remaining = -daysBetween(new Date(expected), today);
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

export function buildTimeline(raw) {
  return buildTimelineForRow(raw);
}
