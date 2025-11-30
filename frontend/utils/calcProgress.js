// frontend/utils/calcProgress.js

// -----------------------------
// 1. MSc and PhD PLAN DEFINITIONS
// -----------------------------

// Each item:
// key   = column name in Google Sheet (tick / date / "completed")
// label = what we show in UI
// year  = programme year (1,2,3)
// q     = quarter in that year (1–4)
// optional = if true, NOT counted in required-progress %
// requiresEvidence = needs upload (P1, Annual Reviews, Internal Eval, Final Submission)

export const MSC_PLAN = [
  {
    key: "Development Plan & Learning Contract",
    label: "Development Plan & Learning Contract",
    year: 1,
    q: 1,
    optional: false,
    requiresEvidence: true,
  },
  {
    key: "Master Research Timeline (Gantt)",
    label: "Master Research Timeline (Year Plan / Gantt)",
    year: 1,
    q: 1,
    optional: true,
    requiresEvidence: false,
  },
  {
    key: "Research Logbook (Weekly)",
    label: "Research Logbook (Weekly)",
    year: 1,
    q: 1,
    optional: true,
    requiresEvidence: false,
  },
  {
    key: "Proposal Defense Endorsed",
    label: "Proposal Defense Endorsed",
    year: 1,
    q: 2,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Pilot / Phase 1 Completed",
    label: "Pilot / Phase 1 Completed",
    year: 1,
    q: 3,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Phase 2 Data Collection Begun",
    label: "Phase 2 Data Collection Begun",
    year: 1,
    q: 3,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Annual Progress Review (Year 1)",
    label: "Annual Progress Review (Year 1)",
    year: 1,
    q: 4,
    optional: false,
    requiresEvidence: true,
  },
  {
    key: "Phase 2 Data Collection Continued",
    label: "Phase 2 Data Collection Continued",
    year: 2,
    q: 1,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Seminar Completed",
    label: "Seminar Completed",
    year: 2,
    q: 1,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Thesis Draft Completed",
    label: "Thesis Draft Completed",
    year: 2,
    q: 2,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Internal Evaluation Completed",
    label: "Internal Evaluation Completed",
    year: 2,
    q: 2,
    optional: false,
    requiresEvidence: true,  // <-- you requested this
  },
  {
    key: "Viva Voce",
    label: "Viva Voce",
    year: 2,
    q: 3,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Corrections Completed",
    label: "Corrections Completed",
    year: 2,
    q: 3,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Final Thesis Submission",
    label: "Final Thesis Submission",
    year: 2,
    q: 4,
    optional: false,
    requiresEvidence: true,
  },
];

export const PHD_PLAN = [
  {
    key: "Development Plan & Learning Contract",
    label: "Development Plan & Learning Contract",
    year: 1,
    q: 1,
    optional: false,
    requiresEvidence: true,
  },
  {
    key: "Master Research Timeline (Gantt)",
    label: "Research Timeline (Gantt)",
    year: 1,
    q: 1,
    optional: true,
    requiresEvidence: false,
  },
  {
    key: "Research Logbook (Weekly)",
    label: "Research Logbook (Weekly)",
    year: 1,
    q: 2,
    optional: true,
    requiresEvidence: false,
  },
  {
    key: "Proposal Defense Endorsed",
    label: "Proposal Defense Endorsed",
    year: 1,
    q: 3,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Pilot / Phase 1 Completed",
    label: "Pilot / Phase 1 Completed",
    year: 1,
    q: 4,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Annual Progress Review (Year 1)",
    label: "Annual Progress Review (Year 1)",
    year: 1,
    q: 4,
    optional: false,
    requiresEvidence: true,
  },
  {
    key: "Phase 2 Completed",
    label: "Phase 2 Data Collection Completed",
    year: 2,
    q: 2,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Seminar Completed",
    label: "Seminar Completed",
    year: 2,
    q: 2,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Data Analysis Completed",
    label: "Data Analysis Completed",
    year: 2,
    q: 3,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "1 Journal Paper Submitted",
    label: "1 Journal Paper Submitted",
    year: 2,
    q: 4,
    optional: false,
    requiresEvidence: true,
  },
  {
    key: "Conference Presentation",
    label: "Conference Presentation",
    year: 2,
    q: 4,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Annual Progress Review (Year 2)",
    label: "Annual Progress Review (Year 2)",
    year: 2,
    q: 4,
    optional: false,
    requiresEvidence: true,
  },
  {
    key: "Thesis Draft Completed",
    label: "Thesis Draft Completed",
    year: 3,
    q: 2,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Internal Evaluation Completed",
    label: "Internal Evaluation Completed",
    year: 3,
    q: 2,
    optional: false,
    requiresEvidence: true,
  },
  {
    key: "Viva Voce",
    label: "Viva Voce",
    year: 3,
    q: 3,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Corrections Completed",
    label: "Corrections Completed",
    year: 3,
    q: 3,
    optional: false,
    requiresEvidence: false,
  },
  {
    key: "Final Thesis Submission",
    label: "Final Thesis Submission",
    year: 3,
    q: 4,
    optional: false,
    requiresEvidence: true,
  },
];

// -----------------------------
// 2. Helpers
// -----------------------------

function isTicked(row, key) {
  if (!row) return false;
  const v = row[key];
  if (v === null || v === undefined) return false;
  const s = String(v).trim().toLowerCase();
  if (!s) return false;
  if (["", "n/a", "na", "#n/a", "-", "—"].includes(s)) return false;
  // any non-empty, non-trash value = ticked (could be YES, TRUE, a date, etc.)
  return true;
}

export function inferProgrammeType(programmeText = "") {
  const p = (programmeText || "").toLowerCase();
  if (p.includes("master") || p.includes("msc")) return "msc";
  return "phd";
}

export function getPlanForProgramme(programmeText = "") {
  const type = inferProgrammeType(programmeText);
  return type === "msc" ? MSC_PLAN : PHD_PLAN;
}

// -----------------------------
// 3. MAIN: Calculate progress
// -----------------------------

// rawRow = the Google Sheet row (row.raw on frontend, or r in backend)
export function calculateProgressFromPlan(rawRow = {}, programmeText = "") {
  const plan = getPlanForProgramme(programmeText || rawRow["Programme"] || "");
  const required = plan.filter((i) => !i.optional);

  const doneRequired = required.filter((i) => isTicked(rawRow, i.key)).length;
  const totalRequired = required.length || 1;
  const percentage = Math.round((doneRequired / totalRequired) * 100);

  const itemsWithStatus = plan.map((i) => ({
    ...i,
    done: isTicked(rawRow, i.key),
  });

  return {
    percentage,
    done: doneRequired,
    total: totalRequired,
    items: itemsWithStatus,
  };
}

// -----------------------------
// 4. Build Timeline Rows for Gantt/Table
// -----------------------------

function addMonths(dateObj, months) {
  const d = new Date(dateObj.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// startDateStr: student's start date from MasterTracking
export function buildTimelineRows(rawRow = {}, startDateStr, programmeText = "") {
  const plan = getPlanForProgramme(programmeText || rawRow["Programme"] || "");
  const base = startDateStr ? new Date(startDateStr) : new Date();

  return plan.map((item) => {
    // quarter start/end: each quarter = 3 months
    const offsetMonths = (item.year - 1) * 12 + (item.q - 1) * 3;
    const startDate = addMonths(base, offsetMonths);
    const endDate = addMonths(base, offsetMonths + 3);
    const expected = formatDate(endDate);

    // Actual: if you later add separate "* Date" columns, prefer that:
    const dateKey = `${item.key} Date`;
    const actualRaw = rawRow[dateKey] || rawRow[item.key] || "";

    return {
      milestone: item.label,
      definition: item.label,
      activity: item.label,
      start: formatDate(startDate),
      expected,
      actual: actualRaw,
    };
  });
}
