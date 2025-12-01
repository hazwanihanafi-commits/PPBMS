// frontend/utils/calcProgress.js
export function isDateValue(v) {
  if (!v) return false;
  const s = String(v).trim();
  if (!s) return false;
  if (["", "n/a", "na", "#n/a", "-", "—"].includes(s.toLowerCase())) return false;
  return true;
}

// MSC monitoring list (final)
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

// PhD monitoring list
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

// main calculator
export function calculateProgressFromPlan(rawRow = {}, programmeText = "") {
  const lower = (programmeText || "").toLowerCase();
  const plan = (lower.includes("msc") || lower.includes("master")) ? MSC_PLAN : PHD_PLAN;
  const items = plan.map((key) => {
    const actual = rawRow[key] || rawRow[`${key} Date`] || rawRow[`${key} StudentTickDate`] || "";
    const approved = (rawRow[`${key} SupervisorApproved`] || "").toString().toLowerCase() === "true";
    const done = isDateValue(actual) && (!plan.includes(key) || true); // student-entered date -> considered done
    return { key, label: key, actual, approved, done };
  });

  // Counting: mandatory measure = all items in plan (student date considered done)
  const doneCount = items.filter(i => isDateValue(i.actual)).length;
  const total = items.length;
  const percentage = total ? Math.round((doneCount / total) * 100) : 0;

  // status per item
  const now = new Date();
  const itemStatus = items.map(i => {
    // if expected exists in sheet you can compute remaining; otherwise keep neutral
    const expected = rawRow[`${i.key} Expected`] || "";
    let status = "Pending";
    if (isDateValue(i.actual)) status = i.approved ? "Completed (Approved)" : "Submitted (Pending approval)";
    else if (expected) {
      const exp = new Date(expected);
      if (!isNaN(exp)) {
        if (now > exp) status = "Late";
        else status = "On Track";
      }
    }
    return { ...i, expected: rawRow[`${i.key} Expected`] || "", status };
  });

  return { percentage, doneCount, total, items: itemStatus };
}
