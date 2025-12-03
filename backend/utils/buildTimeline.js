// backend/utils/buildTimeline.js
import dayjs from "dayjs";

/**
 * Activities map (human label and the Actual column name)
 * The "- Expected" columns will be generated and written by CRON.
 */
export const ACTIVITIES = [
  { key: "Development Plan & Learning Contract", actualCol: "Development Plan & Learning Contract - Actual" },
  { key: "Proposal Defense Endorsed", actualCol: "Proposal Defense Endorsed - Actual" },
  { key: "Pilot / Phase 1 Completed", actualCol: "Pilot / Phase 1 Completed - Actual" },
  { key: "Phase 2 Data Collection Begun", actualCol: "Phase 2 Data Collection Begun - Actual" },
  { key: "Annual Progress Review (Year 1)", actualCol: "Annual Progress Review (Year 1) - Actual" },
  { key: "Phase 2 Data Collection Continued", actualCol: "Phase 2 Data Collection Continued - Actual" },
  { key: "Seminar Completed", actualCol: "Seminar Completed - Actual" },
  { key: "Data Analysis Completed", actualCol: "Data Analysis Completed - Actual" },
  { key: "1 Journal Paper Submitted", actualCol: "1 Journal Paper Submitted - Actual" },
  { key: "Conference Presentation", actualCol: "Conference Presentation - Actual" },
  { key: "Annual Progress Review (Year 2)", actualCol: "Annual Progress Review (Year 2) - Actual" },
  { key: "Thesis Draft Completed", actualCol: "Thesis Draft Completed - Actual" },
  { key: "Final Progress Review (Year 3)", actualCol: "Final Progress Review (Year 3) - Actual" },
  { key: "Viva Voce", actualCol: "Viva Voce - Actual" },
  { key: "Corrections Completed", actualCol: "Corrections Completed - Actual" },
  { key: "Final Thesis Submission", actualCol: "Final Thesis Submission - Actual" },
];

/** generate expected-only list (used by CRON to write to sheet) */
export function buildExpectedOnly(raw) {
  const start = dayjs(raw["Start Date"]);
  const programme = (raw["Programme"] || "").toLowerCase();
  const isPhD = programme.includes("phd");

  // offsets (months) for msc / phd — tweak as needed
  const offsets = {
    "Development Plan & Learning Contract": { msc: 1, phd: 1 },
    "Proposal Defense Endorsed": { msc: 4, phd: 6 },
    "Pilot / Phase 1 Completed": { msc: 6, phd: 8 },
    "Phase 2 Data Collection Begun": { msc: 7, phd: 10 },
    "Annual Progress Review (Year 1)": { msc: 12, phd: 12 },
    "Phase 2 Data Collection Continued": { msc: 14, phd: 16 },
    "Seminar Completed": { msc: 16, phd: 20 },
    "Data Analysis Completed": { msc: 18, phd: 22 },
    "1 Journal Paper Submitted": { msc: 20, phd: 24 },
    "Conference Presentation": { msc: 20, phd: 24 },
    "Annual Progress Review (Year 2)": { msc: 24, phd: 24 },
    "Thesis Draft Completed": { msc: 26, phd: 32 },
    "Final Progress Review (Year 3)": { msc: 28, phd: 34 },
    "Viva Voce": { msc: 30, phd: 36 },
    "Corrections Completed": { msc: 32, phd: 38 },
    "Final Thesis Submission": { msc: 34, phd: 40 },
  };

  const expectedList = ACTIVITIES.map(a => {
    const o = offsets[a.key] || { msc: 12, phd: 12 };
    const months = isPhD ? o.phd : o.msc;
    const expectedDate = start.isValid() ? start.add(months, "month").format("YYYY-MM-DD") : "";
    return { activity: a.key, expectedDate, sheetColumn: `${a.key} - Expected` };
  });

  return expectedList;
}

/** build combined timeline for UI: expected (from cache) + actual (from row) */
export function buildTimelineForRow(raw) {
  // prefer cache
  const email = (raw["Student's Email"] || "").toLowerCase().trim();
  const expectedFromCache = global.expectedTimelineCache?.find(x => (x.email || "").toLowerCase().trim() === email)?.expected;

  const expectedList = expectedFromCache || buildExpectedOnly(raw);

  const timeline = expectedList.map(e => {
    const actualCol = `${e.activity} - Actual`;
    const actual = raw[actualCol] || "";
    const expected = e.expectedDate || "";

    let remaining_days = "";
    let status = "Pending";

    if (actual) {
      status = "Completed";
      remaining_days = 0;
    } else if (expected) {
      const rem = dayjs(expected).diff(dayjs(), "day");
      remaining_days = rem;
      status = rem < 0 ? "Late" : (rem <= 14 ? "Due Soon" : "On Time");
    } else {
      status = "Pending";
      remaining_days = "";
    }

    return {
      activity: e.activity,
      expected,
      actual,
      status,
      remaining_days
    };
  });

  return timeline;
}
