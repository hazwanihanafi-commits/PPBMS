// backend/utils/buildTimeline.js
// Builds timeline rows (activity, expected (YYYY-MM-DD), actual, status, remaining)
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0,10);
}

function daysBetween(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const diff = Math.ceil((d - new Date()) / (1000*60*60*24));
  return diff;
}

export function buildTimelineForRow(row) {
  // detect programme MSC vs PHD
  const programme = (row["Programme"] || "").toLowerCase();
  const isMsc = programme.includes("msc") || programme.includes("master");
  const start = row["Start Date"] || row["start_date"] || "";

  // NOTE: expected schedule offsets (days) — simple defaults. You can replace with better mapping.
  const plan = isMsc ? [
    { activity: "Development Plan & Learning Contract", offsetDays: 30, keyActual: "Development Plan & Learning Contract - Actual", keyFile: "Development Plan & Learning Contract - FileURL", mandatory: true },
    { activity: "Proposal Defense Endorsed", offsetDays: 180, keyActual: "Proposal Defense Endorsed - Actual" },
    { activity: "Pilot / Phase 1 Completed", offsetDays: 240, keyActual: "Pilot / Phase 1 Completed - Actual" },
    { activity: "Phase 2 Data Collection Begun", offsetDays: 270, keyActual: "Phase 2 Data Collection Begun - Actual" },
    { activity: "Annual Progress Review (Year 1)", offsetDays: 365, keyActual: "Annual Progress Review (Year 1) - Actual", keyFile: "Annual Progress Review (Year 1) - FileURL", mandatory: true },
    { activity: "Phase 2 Data Collection Continued", offsetDays: 450, keyActual: "Phase 2 Data Collection Continued - Actual" },
    { activity: "Seminar Completed", offsetDays: 520, keyActual: "Seminar Completed - Actual" },
    { activity: "Thesis Draft Completed", offsetDays: 600, keyActual: "Thesis Draft Completed - Actual" },
    { activity: "Internal Evaluation Completed (Pre-Viva)", offsetDays: 640, keyActual: "Final Progress Review (Year 3) - Actual", keyFile: "Final Progress Review (Year 3) - FileURL", mandatory: true },
    { activity: "Viva Voce", offsetDays: 700, keyActual: "Viva Voce - Actual" },
    { activity: "Corrections Completed", offsetDays: 730, keyActual: "Corrections Completed - Actual" },
    { activity: "Final Thesis Submission", offsetDays: 760, keyActual: "Final Thesis Submission - Actual", mandatory: true }
  ] : [
    // PhD plan ~ 3 years
    { activity: "Development Plan & Learning Contract", offsetDays: 30, keyActual: "Development Plan & Learning Contract - Actual", keyFile: "Development Plan & Learning Contract - FileURL", mandatory: true },
    { activity: "Proposal Defense Endorsed", offsetDays: 240, keyActual: "Proposal Defense Endorsed - Actual" },
    { activity: "Pilot / Phase 1 Completed", offsetDays: 300, keyActual: "Pilot / Phase 1 Completed - Actual" },
    { activity: "Annual Progress Review (Year 1)", offsetDays: 365, keyActual: "Annual Progress Review (Year 1) - Actual", keyFile: "Annual Progress Review (Year 1) - FileURL", mandatory: true },
    { activity: "Phase 2 Completed", offsetDays: 700, keyActual: "Phase 2 Data Collection Continued - Actual" },
    { activity: "Seminar Completed", offsetDays: 760, keyActual: "Seminar Completed - Actual" },
    { activity: "Data Analysis Completed", offsetDays: 820, keyActual: "Data Analysis Completed - Actual" },
    { activity: "1 Journal Paper Submitted", offsetDays: 840, keyActual: "1 Journal Paper Submitted - Actual" },
    { activity: "Conference Presentation", offsetDays: 880, keyActual: "Conference Presentation - Actual" },
    { activity: "Annual Progress Review (Year 2)", offsetDays: 1095, keyActual: "Annual Progress Review (Year 2) - Actual", keyFile: "Annual Progress Review (Year 2) - FileURL", mandatory: true },
    { activity: "Thesis Draft Completed", offsetDays: 1200, keyActual: "Thesis Draft Completed - Actual" },
    { activity: "Final Progress Review (Year 3)", offsetDays: 1280, keyActual: "Final Progress Review (Year 3) - Actual", keyFile: "Final Progress Review (Year 3) - FileURL", mandatory: true },
    { activity: "Viva Voce", offsetDays: 1320, keyActual: "Viva Voce - Actual" },
    { activity: "Corrections Completed", offsetDays: 1360, keyActual: "Corrections Completed - Actual" },
    { activity: "Final Thesis Submission", offsetDays: 1400, keyActual: "Final Thesis Submission - Actual", mandatory: true }
  ];

  // build timeline entries
  const timeline = plan.map((p) => {
    const expected = start ? addDays(start, p.offsetDays) : "";
    const actual = row[p.keyActual] || "";
    let status = "Pending";
    if (actual && actual.trim()) status = "Completed";
    else {
      if (!expected) status = "Pending";
      else {
        const daysLeft = daysBetween(expected);
        status = daysLeft < 0 ? "Late" : "On Track";
      }
    }
    const remaining = actual && actual.trim() ? 0 : (expected ? daysBetween(expected) : null);
    return {
      activity: p.activity,
      expected,
      actual,
      status,
      remaining
    };
  });

  return timeline;
}
