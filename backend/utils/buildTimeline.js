// backend/utils/buildTimeline.js

/* ------------------------------------------------------
   UTIL: compute date difference safely
-------------------------------------------------------*/
function daysBetween(d1, d2) {
  const a = new Date(d1);
  const b = new Date(d2);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  const diff = Math.floor((b - a) / (1000 * 60 * 60 * 24));
  return diff;
}

/* ------------------------------------------------------
   MAIN: build timeline table for frontend
-------------------------------------------------------*/
export function buildTimelineForRow(row) {
  const out = [];

  const keys = Object.keys(row).filter((k) => k.startsWith("Exp: "));

  for (const expKey of keys) {
    const activity = expKey.replace("Exp: ", "");
    const expected = row[expKey] || "";

    const actualKey = `${activity} - Actual`;
    const actual = row[actualKey] || "";

    const today = new Date().toISOString().slice(0, 10);

    let status = "Pending";
    let remaining = null;

    if (actual) {
      // Completed
      status = "Completed";
      remaining = daysBetween(expected, actual);
    } else if (expected) {
      const diffToday = daysBetween(expected, today);
      status = diffToday < 0 ? "Late" : "Pending";
      remaining = diffToday;
    }

    out.push({
      activity,
      expected,
      actual: actual || "",
      status,
      remaining
    });
  }

  return out;
}
