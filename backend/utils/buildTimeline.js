// backend/utils/buildTimeline.js

// ---- MSC TIMELINE ----
const MSC_ITEMS = [
  { activity: "Development Plan & Learning Contract", months: 1 },
  { activity: "Proposal Defense Endorsed", months: 12 },
  { activity: "Pilot / Phase 1 Completed", months: 18 },
  { activity: "Phase 2 Data Collection Begun", months: 20 },
  { activity: "Annual Progress Review (Year 1)", months: 12 },
  { activity: "Phase 2 Data Collection Continued", months: 22 },
  { activity: "Seminar Completed", months: 24 },
  { activity: "Thesis Draft Completed", months: 28 },
  { activity: "Final Progress Review (Year 3)", months: 30 },
  { activity: "Viva Voce", months: 32 },
  { activity: "Corrections Completed", months: 34 },
  { activity: "Final Thesis Submission", months: 36 }
];

// ---- PHD TIMELINE ----
const PHD_ITEMS = [
  { activity: "Development Plan & Learning Contract", months: 1 },
  { activity: "Proposal Defense Endorsed", months: 12 },
  { activity: "Pilot / Phase 1 Completed", months: 18 },
  { activity: "Phase 2 Data Collection Begun", months: 20 },
  { activity: "Annual Progress Review (Year 1)", months: 12 },
  { activity: "Phase 2 Data Collection Continued", months: 28 },
  { activity: "Seminar Completed", months: 30 },
  { activity: "Data Analysis Completed", months: 32 },
  { activity: "1 Journal Paper Submitted", months: 34 },
  { activity: "Conference Presentation", months: 36 },
  { activity: "Annual Progress Review (Year 2)", months: 24 },
  { activity: "Thesis Draft Completed", months: 40 },
  { activity: "Final Progress Review (Year 3)", months: 42 },
  { activity: "Viva Voce", months: 45 },
  { activity: "Corrections Completed", months: 46 },
  { activity: "Final Thesis Submission", months: 48 }
];

// Convert months to expected dates
function addMonths(startDate, months) {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function buildTimelineForRow(row) {
  if (!row) return [];

  const start = row["Start Date"];
  const isMsc = (row["Programme"] || "").toLowerCase().includes("msc");

  const plan = isMsc ? MSC_ITEMS : PHD_ITEMS;

  return plan.map(item => {
    const key = `${item.activity} - Actual`;
    const actual = row[key] || "";

    const expected = addMonths(start, item.months);

    let remaining = "";
    let status = "Pending";

    if (actual) {
      status = "Completed";
      remaining = "0 days";
    } else {
      const diff = (new Date(expected) - new Date()) / 86400000;
      remaining = Math.ceil(diff) + " days";
      status = diff < 0 ? "Late" : "On Track";
    }

    return {
      activity: item.activity,
      expected,
      actual,
      status,
      remaining
    };
  });
}
