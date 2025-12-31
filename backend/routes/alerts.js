import express from "express";
import fs from "fs";
import path from "path";

import {
  readMasterTracking,
  writeSheetCell
} from "../services/googleSheets.js";

import { sendDelayAlert } from "../services/mailer.js";
import sendEmail from "../services/sendEmail.js";

const router = express.Router();

/* =====================================================
   MILESTONE CONFIG (MATCHES SHEET HEADERS)
===================================================== */
const MILESTONES = [
  {
    name: "Development Plan & Learning Contract",
    expected: "Development Plan & Learning Contract - Expected",
    actual: "Development Plan & Learning Contract - Actual",
    sent: "Development Plan & Learning Contract - DELAY EMAIL SENT",
    date: "Development Plan & Learning Contract - DELAY EMAIL DATE"
  },
  {
    name: "Proposal Defense Endorsed",
    expected: "Proposal Defense Endorsed - Expected",
    actual: "Proposal Defense Endorsed - Actual",
    sent: "Proposal Defense Endorsed - DELAY EMAIL SENT",
    date: "Proposal Defense Endorsed - DELAY EMAIL DATE"
  },
  {
    name: "Pilot / Phase 1 Completed",
    expected: "Pilot / Phase 1 Completed - Expected",
    actual: "Pilot / Phase 1 Completed - Actual",
    sent: "Pilot / Phase 1 Completed - DELAY EMAIL SENT",
    date: "Pilot / Phase 1 Completed - DELAY EMAIL DATE"
  },
  {
    name: "Phase 2 Data Collection Begun",
    expected: "Phase 2 Data Collection Begun - Expected",
    actual: "Phase 2 Data Collection Begun - Actual",
    sent: "Phase 2 Data Collection Begun - DELAY EMAIL SENT",
    date: "Phase 2 Data Collection Begun - DELAY EMAIL DATE"
  },
  {
    name: "Annual Progress Review (Year 1)",
    expected: "Annual Progress Review (Year 1) - Expected",
    actual: "Annual Progress Review (Year 1) - Actual",
    sent: "Annual Progress Review (Year 1) - DELAY EMAIL SENT",
    date: "Annual Progress Review (Year 1) - DELAY EMAIL DATE"
  },
  {
    name: "Phase 2 Data Collection Continued",
    expected: "Phase 2 Data Collection Continued - Expected",
    actual: "Phase 2 Data Collection Continued - Actual",
    sent: "Phase 2 Data Collection Continued - DELAY EMAIL SENT",
    date: "Phase 2 Data Collection Continued - DELAY EMAIL DATE"
  },
  {
    name: "Seminar Completed",
    expected: "Seminar Completed - Expected",
    actual: "Seminar Completed - Actual",
    sent: "Seminar Completed - DELAY EMAIL SENT",
    date: "Seminar Completed - DELAY EMAIL DATE"
  },
  {
    name: "Data Analysis Completed",
    expected: "Data Analysis Completed - Expected",
    actual: "Data Analysis Completed - Actual",
    sent: "Data Analysis Completed - DELAY EMAIL SENT",
    date: "Data Analysis Completed - DELAY EMAIL DATE"
  },
  {
    name: "1 Journal Paper Submitted",
    expected: "1 Journal Paper Submitted - Expected",
    actual: "1 Journal Paper Submitted - Actual",
    sent: "1 Journal Paper Submitted - DELAY EMAIL SENT",
    date: "1 Journal Paper Submitted - DELAY EMAIL DATE"
  },
  {
    name: "Conference Presentation",
    expected: "Conference Presentation - Expected",
    actual: "Conference Presentation - Actual",
    sent: "Conference Presentation - DELAY EMAIL SENT",
    date: "Conference Presentation - DELAY EMAIL DATE"
  },
  {
    name: "Annual Progress Review (Year 2)",
    expected: "Annual Progress Review (Year 2) - Expected",
    actual: "Annual Progress Review (Year 2) - Actual",
    sent: "Annual Progress Review (Year 2) - DELAY EMAIL SENT",
    date: "Annual Progress Review (Year 2) - DELAY EMAIL DATE"
  },
  {
    name: "Thesis Draft Completed",
    expected: "Thesis Draft Completed - Expected",
    actual: "Thesis Draft Completed - Actual",
    sent: "Thesis Draft Completed - DELAY EMAIL SENT",
    date: "Thesis Draft Completed - DELAY EMAIL DATE"
  },
  {
    name: "Final Progress Review (Year 3)",
    expected: "Final Progress Review (Year 3) - Expected",
    actual: "Final Progress Review (Year 3) - Actual",
    sent: "Final Progress Review (Year 3) - DELAY EMAIL SENT",
    date: "Final Progress Review (Year 3) - DELAY EMAIL DATE"
  },
  {
    name: "Viva Voce",
    expected: "Viva Voce - Expected",
    actual: "Viva Voce - Actual",
    sent: "Viva Voce - DELAY EMAIL SENT",
    date: "Viva Voce - DELAY EMAIL DATE"
  },
  {
    name: "Corrections Completed",
    expected: "Corrections Completed - Expected",
    actual: "Corrections Completed - Actual",
    sent: "Corrections Completed - DELAY EMAIL SENT",
    date: "Corrections Completed - DELAY EMAIL DATE"
  },
  {
    name: "Final Thesis Submission",
    expected: "Final Thesis Submission - Expected",
    actual: "Final Thesis Submission - Actual",
    sent: "Final Thesis Submission - DELAY EMAIL SENT",
    date: "Final Thesis Submission - DELAY EMAIL DATE"
  }
];

/* =====================================================
   POST /alerts/run-delay-alert
===================================================== */
router.post("/run-delay-alert", async (req, res) => {
  try {
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const logs = [];
    let alertsSent = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2;

      const studentName = row["Student Name"];
      const studentEmail = row["Student's Email"];
      const supervisorEmail = row["Main Supervisor's Email"];

      if (!studentEmail || !supervisorEmail) continue;

      for (const m of MILESTONES) {
        const expected = row[m.expected];
        const actual = row[m.actual];
        const sent = row[m.sent];

        if (!expected) continue;
        if (actual) continue;
        if (sent === "YES") continue;

        const expectedDate = new Date(expected);
        if (isNaN(expectedDate)) continue;
        if (expectedDate >= new Date()) continue;

        const daysLate = Math.floor(
          (new Date() - expectedDate) / (1000 * 60 * 60 * 24)
        );

        try {
          await sendDelayAlert({
            studentName,
            studentEmail,
            supervisorEmail,
            delays: [{
              activity: m.name,
              remaining_days: daysLate
            }]
          });

          await writeSheetCell(
            process.env.SHEET_ID,
            "MasterTracking",
            m.sent,
            rowIndex,
            "YES"
          );

          await writeSheetCell(
            process.env.SHEET_ID,
            "MasterTracking",
            m.date,
            rowIndex,
            new Date().toISOString().slice(0, 10)
          );

          logs.push({
            student: studentName,
            milestone: m.name,
            daysLate,
            emailedAt: new Date().toISOString()
          });

          alertsSent++;

          await new Promise(r => setTimeout(r, 1200));

        } catch (err) {
          console.error(
            `❌ Delay alert failed for ${studentName} (${m.name}):`,
            err.message
          );
        }
      }
    }

    res.json({ success: true, alertsSent });

  } catch (e) {
    console.error("DELAY ALERT ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

/* =====================================================
   POST /alerts/test-email
===================================================== */
router.post("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: "hazwanihanafi@gmail.com",
      subject: "[PPBMS TEST] Email system working",
      text: "Delay alert test email successful."
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
