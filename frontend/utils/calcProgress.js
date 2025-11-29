// utils/calcProgress.js

export const ACTIVITIES_12 = [
  "P1 Submitted",
  "P3 Submitted",
  "P4 Submitted",
  "P5 Submitted",
  "Thesis Draft Completed",
  "Ethical clearance obtained",
  "Pilot or Phase 1 completed",
  "Progress approved",
  "Seminar & report submitted",
  "Phase 2 completed",
  "1 indexed paper submitted",
  "Conference presentation"
];

/**
 * returns { done, total, percentage }
 */
export function calculateProgressFrom12(row) {
  const activities = ACTIVITIES_12;
  const done = activities.filter(a => {
    const v = row?.[a];
    if (!v) return false;
    const s = String(v).trim().toLowerCase();
    if (!s) return false;
    if (["", "n/a", "na", "#n/a", "-", "—"].includes(s)) return false;
    return true;
  }).length;

  const percentage = Math.round((done / activities.length) * 100);
  return { done, total: activities.length, percentage };
}
