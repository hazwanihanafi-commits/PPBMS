// backend/utils/timeline.js
import { differenceInDays, parseISO } from "date-fns";

// -----------------------------------------------------
// 1) Define MSC & PhD activity plans WITH expected dates
// -----------------------------------------------------
export const MSC_PLAN = [
  { activity: "Development Plan & Learning Contract", expected: "2024-02-01" },
  { activity: "Proposal Defense Endorsed", expected: "2024-12-01" },
  { activity: "Pilot / Phase 1 Completed", expected: "2025-03-01" },
  { activity: "Phase 2 Data Collection Begun", expected: "2025-06-01" },
  { activity: "Annual Progress Review (Year 1)", expected: "2025-09-01" },
  { activity: "Phase 2 Data Collection Continued", expected: "2025-10-01" },
  { activity: "Seminar Completed", expected: "2026-02-01" },
  { activity: "Thesis Draft Completed", expected: "2026-05-01" },
  { activity: "Final Progress Review (Year 3)", expected: "2026-06-01" },
  { activity: "Viva Voce", expected: "2026-08-01" },
  { activity: "Corrections Completed", expected: "2026-09-01" },
  { activity: "Final Thesis Submission", expected: "2026-10-01" },
];

export const PHD_PLAN = [
  { activity: "Development Plan & Learning Contract", expected: "2024-02-01" },
  { activity: "Proposal Defense Endorsed", expected: "2024-12-01" },
  { activity: "Pilot / Phase 1 Completed", expected: "2025-06-01" },
  { activity: "Annual Progress Review (Year 1)", expected: "2025-09-01" },
  { activity: "Phase 2 Completed", expected: "2026-03-01" },
  { activity: "Seminar Completed", expected: "2026-05-01" },
  { activity: "Data Analysis Completed", expected: "2026-09-01" },
  { activity: "1 Journal Paper Submitted", expected: "2026-10-01" },
  { activity: "Conference Presentation", expected: "2026-11-01" },
  { activity: "Annual Progress Review (Year 2)", expected: "2026-12-01" },
  { activity: "Thesis Draft Completed", expected: "2027-03-01" },
  { activity: "Final Progress Review (Year 3)", expected: "2027-05-01" },
  { activity: "Viva Voce", expected: "2027-08-01" },
  { activity: "Corrections Completed", expected: "2027-09-01" },
  { activity: "Final Thesis Submission", expected: "2027-10-01" },
];

// -----------------------------------------------------
// 2) Build timeline rows dynamically
// -----------------------------------------------------
export function buildTimeline(raw, programme) {
  const plan = programme.toLowerCase().includes("phd") ? PHD_PLAN : MSC_PLAN;

  return plan.map((item) => {
    const actual = raw[`${item.activity} - Actual`] || "";
    const expected = item.expected;

    let status = "Pending";
    let remaining = "";

    if (actual) {
      status = "Completed";
      remaining = "0";
    } else {
      const daysLeft = differenceInDays(parseISO(expected), new Date());
      remaining = daysLeft;
      status = daysLeft < 0 ? "Late" : "On Track";
    }

    return {
      activity: item.activity,
      expected,
      actual,
      status,
      remaining,
    };
  });
}
