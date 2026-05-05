// ==========================================
// NORMALIZERS (FINAL - MATCH YOUR SHEET)
// ==========================================

export function normalizeText(v) {
  return String(v || "").trim();
}

export function normalizeProgramme(p) {
  return String(p || "").toUpperCase().trim();
}

/* ==========================================
   STATUS NORMALIZER (CRITICAL)
========================================== */
export function normalizeStatus(raw) {

  const s = String(raw || "")
    .toLowerCase()
    .trim();

  // ACTIVE
  if (
    s === "active" ||
    s === "in progress" ||
    s === "ongoing"
  ) {
    return "ACTIVE";
  }

  // GRADUATED
  if (
    s === "graduated" ||
    s === "complete" ||
    s === "completed"
  ) {
    return "GRADUATED";
  }

  // SUSPENSION (your exact wording)
  if (
    s.includes("suspension")
  ) {
    return "SUSPENDED";
  }

  // TERMINATED (your exact wording)
  if (
    s.includes("terminated")
  ) {
    return "TERMINATED";
  }

  return "UNKNOWN";
}

/* ==========================================
   EMAIL NORMALIZER
========================================== */
export function normEmail(v) {
  return String(v || "")
    .toLowerCase()
    .trim();
}

/* ==========================================
   MATRIC NORMALIZER
========================================== */
export function normMatric(v) {
  return String(v || "")
    .toUpperCase()
    .trim();
}
