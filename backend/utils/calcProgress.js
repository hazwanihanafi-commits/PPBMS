// utils/calcProgress.js
export const ACTIVITY_PLAN = [
  { key: "Development Plan & Learning Contract", expected: "2022-09-30" },
  { key: "Proposal Defense Endorsed", expected: "2022-11-30" },
  { key: "Pilot / Phase 1 Completed", expected: "2023-01-31" },
  { key: "Phase 2 Data Collection Begun", expected: "2023-04-30" },
  { key: "Annual Progress Review (Year 1)", expected: "2023-09-30" },
  { key: "Phase 2 Data Collection Continued", expected: "2023-11-30" },
  { key: "Seminar Completed", expected: "2024-01-31" },
  { key: "Data Analysis Completed", expected: "2024-04-30" },
  { key: "1 Journal Paper Submitted", expected: "2024-06-30" },
  { key: "Conference Presentation", expected: "2024-09-30" },
  { key: "Annual Progress Review (Year 2)", expected: "2024-11-30" },
  { key: "Thesis Draft Completed", expected: "2025-03-31" },
  { key: "Final Progress Review (Year 3)", expected: "2025-09-30" },
  { key: "Viva Voce", expected: "2025-11-30" },
  { key: "Corrections Completed", expected: "2025-12-31" },
  { key: "Final Thesis Submission", expected: "2026-03-31" }
];

export function buildTimeline(rawRow) {
  const today = new Date();

  return ACTIVITY_PLAN.map((item) => {
    const expected = item.expected;
    const actual = rawRow?.[`${item.key} - Actual`] || "";

    let status = "Pending";
    let remaining = "-";

    if (actual) {
      // Completed
      status = "Completed";
    } else {
      const expDate = new Date(expected);
      const diff = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      remaining = diff;

      if (diff < 0) status = "Delayed";
      else status = "On Track";
    }

    return {
      activity: item.key,
      expected,
      actual: actual || "",
      status,
      remaining
    };
  });
}
