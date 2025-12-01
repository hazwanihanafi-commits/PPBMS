import { differenceInDays, parseISO } from "date-fns";

export function buildTimeline(rawRow) {
  if (!rawRow) return [];

  const ACTIVITIES = [
    { key: "Development Plan & Learning Contract", expected: rawRow["DP Expected"] },
    { key: "Proposal Defense Endorsed", expected: rawRow["PDE Expected"] },
    { key: "Pilot / Phase 1 Completed", expected: rawRow["Pilot Expected"] },
    { key: "Phase 2 Data Collection Begun", expected: rawRow["Phase2A Expected"] },
    { key: "Annual Progress Review (Year 1)", expected: rawRow["APR1 Expected"] },
    { key: "Phase 2 Data Collection Continued", expected: rawRow["Phase2B Expected"] },
    { key: "Seminar Completed", expected: rawRow["Seminar Expected"] },
    { key: "Data Analysis Completed", expected: rawRow["DataAnalysis Expected"] },
    { key: "1 Journal Paper Submitted", expected: rawRow["Journal Expected"] },
    { key: "Conference Presentation", expected: rawRow["Conference Expected"] },
    { key: "Annual Progress Review (Year 2)", expected: rawRow["APR2 Expected"] },
    { key: "Thesis Draft Completed", expected: rawRow["ThesisDraft Expected"] },
    { key: "Final Progress Review (Year 3)", expected: rawRow["FPR Expected"] },
    { key: "Viva Voce", expected: rawRow["Viva Expected"] },
    { key: "Corrections Completed", expected: rawRow["Corrections Expected"] },
    { key: "Final Thesis Submission", expected: rawRow["ThesisSubmit Expected"] },
  ];

  return ACTIVITIES.map((act) => {
    const actual = rawRow[`${act.key} - Actual`] || "";

    // Status
    let status = "Pending";
    if (actual) {
      status = "Completed";
    } else if (act.expected && new Date() > new Date(act.expected)) {
      status = "Delayed";
    } else if (act.expected) {
      status = "On Track";
    }

    // Remaining days
    let remaining = "-";
    if (!actual && act.expected) {
      const today = new Date();
      const exp = parseISO(act.expected);
      const diff = differenceInDays(exp, today);
      remaining = diff < 0 ? 0 : diff;
    }

    return {
      activity: act.key,
      expected: act.expected || "-",
      actual: actual || "-",
      status,
      remaining,
    };
  });
}
