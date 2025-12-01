// backend/utils/buildTimeline.js

import { differenceInCalendarDays, parseISO } from "date-fns";

/*
----------------------------------------------------------
 DEFINE MASTER ACTIVITY LIST (same order for MSC + PhD)
----------------------------------------------------------
*/

export const ACTIVITIES = [
  {
    key: "Development Plan & Learning Contract - Actual",
    name: "Development Plan & Learning Contract",
    expectedMonth: 2,  // 2 months after start
    mandatory: true
  },
  {
    key: "Proposal Defense Endorsed - Actual",
    name: "Proposal Defense Endorsed",
    expectedMonth: 12
  },
  {
    key: "Pilot / Phase 1 Completed - Actual",
    name: "Pilot / Phase 1 Completed",
    expectedMonth: 18
  },
  {
    key: "Phase 2 Data Collection Begun - Actual",
    name: "Phase 2 Data Collection Begun",
    expectedMonth: 20
  },
  {
    key: "Annual Progress Review (Year 1) - Actual",
    name: "Annual Progress Review (Year 1)",
    expectedMonth: 12,
    mandatory: true
  },
  {
    key: "Phase 2 Data Collection Continued - Actual",
    name: "Phase 2 Data Collection Continued",
    expectedMonth: 24
  },
  {
    key: "Seminar Completed - Actual",
    name: "Seminar Completed",
    expectedMonth: 24
  },
  {
    key: "Data Analysis Completed - Actual",
    name: "Data Analysis Completed",
    expectedMonth: 30
  },
  {
    key: "1 Journal Paper Submitted - Actual",
    name: "1 Journal Paper Submitted",
    expectedMonth: 30
  },
  {
    key: "Conference Presentation - Actual",
    name: "Conference Presentation",
    expectedMonth: 30
  },
  {
    key: "Annual Progress Review (Year 2) - Actual",
    name: "Annual Progress Review (Year 2)",
    expectedMonth: 24,
    mandatory: true
  },
  {
    key: "Thesis Draft Completed - Actual",
    name: "Thesis Draft Completed",
    expectedMonth: 36
  },
  {
    key: "Final Progress Review (Year 3) - Actual",
    name: "Final Progress Review (Year 3)",
    expectedMonth: 36,
    mandatory: true
  },
  {
    key: "Viva Voce - Actual",
    name: "Viva Voce",
    expectedMonth: 40
  },
  {
    key: "Corrections Completed - Actual",
    name: "Corrections Completed",
    expectedMonth: 42
  },
  {
    key: "Final Thesis Submission - Actual",
    name: "Final Thesis Submission",
    expectedMonth: 48
  }
];

/*
----------------------------------------------------------
 BUILD TIMELINE FUNCTION
 Converts sheet row → timeline array
----------------------------------------------------------
*/

export function buildTimeline(raw) {
  if (!raw) return [];

  const startDateStr = raw["Start Date"];
  if (!startDateStr) return [];

  const startDate = parseISO(startDateStr);
  const today = new Date();

  const timeline = ACTIVITIES.map((item) => {
    // expected date = start date + expectedMonth
    const expected = new Date(startDate);
    expected.setMonth(expected.getMonth() + item.expectedMonth);
    const expectedStr = expected.toISOString().slice(0, 10);

    // actual date from sheet
    const actual = raw[item.key] || "";
    const actualStr = actual || "";

    let status = "Pending";
    let remaining = "";

    if (actualStr) {
      status = "Completed";
      remaining = "0 days";
    } else {
      const daysLeft = differenceInCalendarDays(expected, today);

      if (daysLeft < 0) {
        status = "Late";
        remaining = `${Math.abs(daysLeft)} days overdue`;
      } else {
        status = "On Track";
        remaining = `${daysLeft} days`;
      }
    }

    return {
      activity: item.name,
      key: item.key,
      expected: expectedStr,
      actual: actualStr,
      status,
      remaining,
      mandatory: !!item.mandatory
    };
  });

  return timeline;
}

/*
----------------------------------------------------------
 DEFAULT EXPORT
----------------------------------------------------------
*/
export default buildTimeline;
