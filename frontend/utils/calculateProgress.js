// utils/calculateProgress.js

export function calculateProgressFrom12(row) {
  const activities = [
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

  const done = activities.filter(a => {
    const v = row?.[a];
    if (!v) return false;

    const s = String(v).trim().toLowerCase();
    if (!s) return false;

    // treat these as NOT submitted
    if (["", "n/a", "na", "#n/a", "-", "—"].includes(s)) return false;

    return true;
  }).length;

  return {
    done,
    total: activities.length,
    percentage: Math.round((done / activities.length) * 100)
  };
}
