// frontend/utils/calcProgress.js
// Helpers for progress calculation and status (tick-based + expected/actual dates)

function safeStr(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

export function isTicked(rawRow, key) {
  // Accept non-empty string or a truthy value as tick/approval
  if (!rawRow) return false;
  const v = rawRow[key];
  if (v === undefined || v === null) return false;
  const s = safeStr(v).toLowerCase();
  if (!s) return false;
  if (["", "n/a", "na", "#n/a", "-", "—"].includes(s)) return false;
  return true;
}

// MSc plan (removed Logbook per request; Gantt optional)
export const MSC_PLAN = [
  { key: "Development Plan & Learning Contract", label: "Development Plan & Learning Contract", mandatory: true },
  { key: "Proposal Defense Endorsed", label: "Proposal Defense Endorsed", mandatory: true },
  { key: "Pilot / Phase 1 Completed", label: "Pilot / Phase 1 Completed", mandatory: true },
  { key: "Phase 2 Data Collection Begun", label: "Phase 2 Data Collection Begun", mandatory: true },
  { key: "Annual Progress Review (Year 1)", label: "Annual Progress Review (Year 1)", mandatory: true },
  { key: "Phase 2 Data Collection Continued", label: "Phase 2 Data Collection Continued", mandatory: true },
  { key: "Seminar Completed", label: "Seminar Completed", mandatory: true },
  { key: "Thesis Draft Completed", label: "Thesis Draft Completed", mandatory: true },
  { key: "Internal Evaluation Completed", label: "Internal Evaluation Completed", mandatory: true },
  { key: "Viva Voce", label: "Viva Voce", mandatory: true },
  { key: "Corrections Completed", label: "Corrections Completed", mandatory: true },
  { key: "Final Thesis Submission", label: "Final Thesis Submission", mandatory: true },
];

// PhD plan
export const PHD_PLAN = [
  { key: "Development Plan & Learning Contract", label: "Development Plan & Learning Contract", mandatory: true },
  { key: "Proposal Defense Endorsed", label: "Proposal Defense Endorsed", mandatory: true },
  { key: "Pilot / Phase 1 Completed", label: "Pilot / Phase 1 Completed", mandatory: true },
  { key: "Annual Progress Review (Year 1)", label: "Annual Progress Review (Year 1)", mandatory: true },
  { key: "Phase 2 Completed", label: "Phase 2 Completed", mandatory: true },
  { key: "Seminar Completed", label: "Seminar Completed", mandatory: true },
  { key: "Data Analysis Completed", label: "Data Analysis Completed", mandatory: true },
  { key: "1 Journal Paper Submitted", label: "1 Journal Paper Submitted", mandatory: true },
  { key: "Conference Presentation", label: "Conference Presentation", mandatory: true },
  { key: "Annual Progress Review (Year 2)", label: "Annual Progress Review (Year 2)", mandatory: true },
  { key: "Thesis Draft Completed", label: "Thesis Draft Completed", mandatory: true },
  { key: "Internal Evaluation Completed", label: "Internal Evaluation Completed", mandatory: true },
  { key: "Viva Voce", label: "Viva Voce", mandatory: true },
  { key: "Corrections Completed", label: "Corrections Completed", mandatory: true },
  { key: "Final Thesis Submission", label: "Final Thesis Submission", mandatory: true },
];

// parse date-ish value to Date (best-effort)
function parseDateBestEffort(v) {
  if (!v) return null;
  // if already ISO or yyyy-mm-dd, Date can parse
  const s = safeStr(v);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  // try splitting dd/mm/yyyy
  if (s.includes("/")) {
    const parts = s.split("/");
    if (parts.length === 3) {
      const [d1, m1, y1] = parts;
      const iso = `${y1}-${m1.padStart(2, "0")}-${d1.padStart(2, "0")}`;
      const dd = new Date(iso);
      if (!isNaN(dd.getTime())) return dd;
    }
  }
  return null;
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// For each plan item we expect these sheet fields (convention):
//  - "<key> Expected"  (optional)
//  - "<key> Actual"    (student tick date or uploaded date)
//  - "<key> Supervisor Approved"  (truthy when supervisor endorses)
//  - "<key> Student Tick"         (truthy when student ticks)
//  - "<key> Document Link"        (when file is required)
// compute item-level status and remaining days
export function statusForItem(rawRow = {}, key) {
  const expectedRaw = rawRow[`${key} Expected`] || rawRow[`${key} Expected Date`] || "";
  const actualRaw = rawRow[`${key} Actual`] || rawRow[`${key} Actual Date`] || rawRow[key] || "";
  const studentTick = isTicked(rawRow, `${key} Student Tick`) || isTicked(rawRow, key);
  const supervisorApproved = isTicked(rawRow, `${key} Supervisor Approved`) || isTicked(rawRow, `${key} SupervisorApproval`);
  const expectedDate = parseDateBestEffort(expectedRaw);
  const actualDate = parseDateBestEffort(actualRaw) || (studentTick ? new Date() : null);

  let status = "Pending";
  if (supervisorApproved) status = "Completed";
  else if (actualDate && studentTick) status = "Awaiting Approval";
  else if (actualDate) status = "Completed";
  else if (expectedDate) {
    const now = new Date();
    if (now > expectedDate) status = "Behind";
    else status = "On Track";
  } else {
    status = "No target";
  }

  const remaining = expectedDate ? daysBetween(new Date(), expectedDate) : null; // positive means days left
  // if already past expected, remaining negative => overdue
  return {
    expected: expectedDate ? expectedDate.toISOString().split("T")[0] : "",
    actual: actualDate ? actualDate.toISOString().split("T")[0] : "",
    status,
    remaining: remaining === null ? "—" : (remaining < 0 ? `${Math.abs(remaining)}d overdue` : `${remaining}d`),
    studentTick,
    supervisorApproved,
  };
}

export function calculateProgress(rawRow = {}, programmeText = "") {
  const lower = (programmeText || "").toLowerCase();
  const plan = (lower.includes("msc") || lower.includes("master")) ? MSC_PLAN : PHD_PLAN;

  const items = plan.map((it) => {
    const s = statusForItem(rawRow, it.key);
    return { ...it, ...s };
  });

  const doneCount = items.filter(i => i.supervisorApproved || i.status === "Completed").length;
  const total = items.length;
  const percentage = total ? Math.round((doneCount / total) * 100) : 0;

  return { percentage, doneCount, total, items };
}
