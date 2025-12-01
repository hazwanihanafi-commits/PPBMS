// frontend/utils/calcProgress.js
// Calculate progress for MSc / PhD plans (tick-by-student date + supervisor approval not required
// for the checklist percentage — student fills Actual Date; supervisor approves mandatory docs)

export function isFilled(value) {
  if (!value && value !== 0) return false;
  const s = String(value).trim().toLowerCase();
  return !(["", "n/a", "na", "#n/a", "-", "—"].includes(s));
}

export const MSC_PLAN = [
  "Development Plan & Learning Contract",
  "Proposal Defense Endorsed",
  "Pilot / Phase 1 Completed",
  "Phase 2 Data Collection Begun",
  "Annual Progress Review (Year 1)",
  "Phase 2 Data Collection Continued",
  "Seminar Completed",
  "Thesis Draft Completed",
  "Internal Evaluation Completed (Pre-Viva)",
  "Viva Voce",
  "Corrections Completed",
  "Final Thesis Submission"
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
  "Internal Evaluation Completed (Pre-Viva)",
  "Viva Voce",
  "Corrections Completed",
  "Final Thesis Submission"
];

export function getPlanForProgramme(programmeText = "") {
  const lower = (programmeText || "").toLowerCase();
  if (lower.includes("msc") || lower.includes("master")) return MSC_PLAN;
  return PHD_PLAN;
}

/**
 * calculateProgress(rowRaw, programmeText)
 * - rowRaw: object with sheet row fields (or DB row)
 * - returns: { doneCount, total, percentage, items: [{ key, label, actual, isDone, mandatory }] }
 */
export function calculateProgress(rowRaw = {}, programmeText = "") {
  const plan = getPlanForProgramme(programmeText);
  const items = plan.map((label) => {
    // keys in sheet are expected to be "<label>" or "<label> - Actual" etc.
    // We'll look for either exact label key or "{label} - Actual"
    const possibleKeys = [label, `${label} - Actual`, `${label} Actual`, `${label} Date`];
    let actual = "";
    for (const k of possibleKeys) {
      if (Object.prototype.hasOwnProperty.call(rowRaw, k) && isFilled(rowRaw[k])) {
        actual = rowRaw[k];
        break;
      }
    }
    const isDone = !!actual && isFilled(actual);
    // define mandatory: Development Plan, Annual reviews, Internal evaluation, Final submit
    const mandatory =
      label === "Development Plan & Learning Contract" ||
      label.includes("Annual Progress Review") ||
      label.includes("Internal Evaluation") ||
      label.includes("Final Thesis Submission");
    return { key: label, label, actual, isDone, mandatory };
  });

  const doneCount = items.filter(i => i.isDone).length;
  const total = items.length;
  const percentage = total ? Math.round((doneCount / total) * 100) : 0;

  return { doneCount, total, percentage, items };
}
