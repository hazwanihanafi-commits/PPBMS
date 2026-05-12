// backend/utils/buildTimeline.js

import dayjs from "dayjs";

/* =========================================================
   MSc ACTIVITIES
========================================================= */

export const MSC_ACTIVITIES = [

  {
    key: "Development Plan & Learning Contract",
    actualCol:
      "Development Plan & Learning Contract - Actual"
  },

  {
    key: "Proposal Defense Endorsed",
    actualCol:
      "Proposal Defense Endorsed - Actual"
  },

  {
    key: "Pilot / Phase 1 Completed",
    actualCol:
      "Pilot / Phase 1 Completed - Actual"
  },

  {
    key: "Phase 2 Data Collection Begun",
    actualCol:
      "Phase 2 Data Collection Begun - Actual"
  },

  {
    key: "Annual Progress Review (Year 1)",
    actualCol:
      "Annual Progress Review (Year 1) - Actual"
  },

  {
    key: "Phase 2 Data Collection Continued",
    actualCol:
      "Phase 2 Data Collection Continued - Actual"
  },

  {
    key: "Seminar Completed",
    actualCol:
      "Seminar Completed - Actual"
  },

  {
    key: "Data Analysis Completed",
    actualCol:
      "Data Analysis Completed - Actual"
  },

  {
    key: "Conference Presentation",
    actualCol:
      "Conference Presentation - Actual"
  },

  {
    key: "Thesis Draft Completed",
    actualCol:
      "Thesis Draft Completed - Actual"
  },

  {
    key: "Viva Voce",
    actualCol:
      "Viva Voce - Actual"
  },

  {
    key: "Corrections Completed",
    actualCol:
      "Corrections Completed - Actual"
  },

  {
    key: "Final Thesis Submission",
    actualCol:
      "Final Thesis Submission - Actual"
  },
];

/* =========================================================
   PhD ACTIVITIES
========================================================= */

export const PHD_ACTIVITIES = [

  {
    key: "Development Plan & Learning Contract",
    actualCol:
      "Development Plan & Learning Contract - Actual"
  },

  {
    key: "Proposal Defense Endorsed",
    actualCol:
      "Proposal Defense Endorsed - Actual"
  },

  {
    key: "Pilot / Phase 1 Completed",
    actualCol:
      "Pilot / Phase 1 Completed - Actual"
  },

  {
    key: "Annual Progress Review (Year 1)",
    actualCol:
      "Annual Progress Review (Year 1) - Actual"
  },

  {
    key: "Phase 2 Data Collection Continued",
    actualCol:
      "Phase 2 Data Collection Continued - Actual"
  },

  {
    key: "Seminar Completed",
    actualCol:
      "Seminar Completed - Actual"
  },

  {
    key: "Data Analysis Completed",
    actualCol:
      "Data Analysis Completed - Actual"
  },

  {
    key: "1 Journal Paper Submitted",
    actualCol:
      "1 Journal Paper Submitted - Actual"
  },

  {
    key: "Conference Presentation",
    actualCol:
      "Conference Presentation - Actual"
  },

  {
    key: "Annual Progress Review (Year 2)",
    actualCol:
      "Annual Progress Review (Year 2) - Actual"
  },

  {
    key: "Thesis Draft Completed",
    actualCol:
      "Thesis Draft Completed - Actual"
  },

  {
    key: "Pre-Viva Review",
    actualCol:
      "Pre-Viva Review - Actual"
  },

  {
    key: "Viva Voce",
    actualCol:
      "Viva Voce - Actual"
  },

  {
    key: "Corrections Completed",
    actualCol:
      "Corrections Completed - Actual"
  },

  {
    key: "Final Thesis Submission",
    actualCol:
      "Final Thesis Submission - Actual"
  },
];

/* =========================================================
   BUILD EXPECTED TIMELINE
========================================================= */

export function buildExpectedOnly(raw) {

  const start =
    dayjs(raw["Start Date"]);

  const programme =
    (
      raw["Programme"] || ""
    ).toLowerCase();

  const isPhD =
  programme.includes("doctor") ||
  programme.includes("phd");
  
   const activities =
    isPhD
      ? PHD_ACTIVITIES
      : MSC_ACTIVITIES;

  /* =======================================================
     OFFSETS (MONTHS)
  ======================================================= */

  const offsets = {

    "Development Plan & Learning Contract":
      { msc: 1, phd: 1 },

    "Proposal Defense Endorsed":
      { msc: 3, phd: 6 },

    "Pilot / Phase 1 Completed":
      { msc: 5, phd: 8 },

    "Phase 2 Data Collection Begun":
      { msc: 6, phd: 10 },

    "Annual Progress Review (Year 1)":
      { msc: 12, phd: 12 },

    "Phase 2 Data Collection Continued":
      { msc: 13, phd: 16 },

    "Seminar Completed":
      { msc: 15, phd: 20 },

    "Data Analysis Completed":
      { msc: 16, phd: 22 },

    "1 Journal Paper Submitted":
      { msc: 0, phd: 24 },

    "Conference Presentation":
      { msc: 17, phd: 24 },

    "Annual Progress Review (Year 2)":
      { msc: 0, phd: 24 },

    "Thesis Draft Completed":
      { msc: 18, phd: 32 },

    "Pre-Viva Review":
      { msc: 0, phd: 34 },

    "Viva Voce":
      { msc: 21, phd: 36 },

    "Corrections Completed":
      { msc: 22, phd: 38 },

    "Final Thesis Submission":
      { msc: 24, phd: 40 },
  };

  const expectedList =
    activities.map(a => {

      const o =
        offsets[a.key] ||
        { msc: 12, phd: 12 };

      const months =
        isPhD
          ? o.phd
          : o.msc;

      const expectedDate =
        start.isValid()
          ? start
              .add(months, "month")
              .format("YYYY-MM-DD")
          : "";

      return {

        activity:
          a.key,

        expectedDate,

        sheetColumn:
          `${a.key} - Expected`

      };
    });

  return expectedList;
}

/* =========================================================
   BUILD TIMELINE FOR UI
========================================================= */

export function buildTimelineForRow(raw) {

  const email =
    (
      raw["Student's Email"] || ""
    )
      .toLowerCase()
      .trim();

  const expectedFromCache =
    global.expectedTimelineCache
      ?.find(
        x =>
          (
            x.email || ""
          )
            .toLowerCase()
            .trim() === email
      )
      ?.expected;

  const expectedList =
    expectedFromCache ||
    buildExpectedOnly(raw);

  const timeline =
    expectedList.map(e => {

      const actualCol =
        `${e.activity} - Actual`;

      const actual =
        raw[actualCol] || "";

      const expected =
        e.expectedDate || "";

      let remaining_days = "";
      let status = "PENDING";

      /* ===============================================
         COMPLETED
      =============================================== */

      if (actual) {

        status = "COMPLETED";
        remaining_days = 0;

      }

      /* ===============================================
         HAS EXPECTED DATE
      =============================================== */

      else if (expected) {

        const rem =
          dayjs(expected)
            .diff(dayjs(), "day");

        remaining_days = rem;

        /* ===========================================
           OVERDUE > 30 DAYS
        =========================================== */

        if (rem < -30) {

          status = "AT_RISK";

        }

        /* ===========================================
           OVERDUE < 30 DAYS
        =========================================== */

        else if (rem < 0) {

          status =
            "SLIGHTLY_DELAYED";

        }

        /* ===========================================
           FUTURE
        =========================================== */

        else {

          status = "ON_TRACK";

        }

      }

      /* ===============================================
         NO EXPECTED DATE
      =============================================== */

      else {

        status = "PENDING";
        remaining_days = "";

      }

      return {

        activity:
          e.activity,

        expected,

        actual,

        status,

        remaining_days

      };
    });

  return timeline;
}
