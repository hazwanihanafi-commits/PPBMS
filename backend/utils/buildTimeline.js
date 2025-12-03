// buildTimeline.js

export function buildTimelineForRow(row) {
  if (!row) return [];

  const timeline = [];

  // STEP 1 — find all expected columns
  Object.keys(row).forEach((key) => {
    if (key.startsWith("Exp:")) {
      const activity = key.replace("Exp:", "").trim();

      const expected = row[key] || "";
      const actual = row[`${activity} - Actual`] || "";
      const fileURL = row[`${activity} - FileURL`] || "";

      // status
      let status = "Pending";
      let remaining = "";

      if (expected) {
        const today = new Date();
        const exp = new Date(expected);

        const diffDays = Math.floor((exp - today) / (1000 * 60 * 60 * 24));
        remaining = diffDays;

        if (actual) {
          status = "Completed";
          remaining = 0;
        } else if (diffDays < 0) {
          status = "Late";
        } else {
          status = "Upcoming";
        }
      }

      timeline.push({
        activity,
        expected,
        actual,
        fileURL,
        status,
        remaining_days: remaining,
      });
    }
  });

  return timeline;
}
