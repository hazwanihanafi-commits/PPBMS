import express from "express";
import fs from "fs";
import path from "path";

import {
  readMasterTracking,
  writeSheetCell
} from "../services/googleSheets.js";

import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { sendDelayAlert } from "../services/mailer.js";
import sendEmail from "./sendEmail.js";

const router = express.Router();

/* =====================================================
   POST /alerts/run-delay-alert
   ✔ PER-MILESTONE DELAY EMAIL
===================================================== */
router.post("/run-delay-alert", async (req, res) => {
  try {
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const logs = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2; // Google Sheet row number

      const timeline = buildTimelineForRow(row);

      // 🔴 Only LATE milestones
      const lateMilestones = timeline.filter(
        t => t.status === "Late"
      );

      if (!lateMilestones.length) continue;

      const studentName = row["Student Name"];
      const studentEmail = row["Student's Email"];
      const supervisorEmail = row["Main Supervisor's Email"];
      const adminEmail = process.env.ADMIN_EMAIL;

      if (!studentEmail || !supervisorEmail) continue;

      for (const milestone of lateMilestones) {

        const remarkColumn = `${milestone.activity} - Remark`;
        const existingRemark = row[remarkColumn];

        // ⛔ Already emailed for THIS milestone
        if (existingRemark === "DELAY_EMAIL_SENT") {
          continue;
        }

        /* ===== SEND EMAIL ===== */
        try {
          await sendDelayAlert({
            studentName,
            studentEmail,
            supervisorEmail,
            adminEmails: [adminEmail],
            delays: [milestone]
          });

          // ✅ Mark as emailed (PER milestone)
          await writeSheetCell(
            process.env.SHEET_ID,
            "MasterTracking",
            remarkColumn,
            rowIndex,
            "DELAY_EMAIL_SENT"
          );

          logs.push({
            student: studentName,
            activity: milestone.activity,
            expected: milestone.expected,
            daysLate: Math.abs(milestone.remaining_days),
            emailedAt: new Date().toISOString()
          });

          // 🔑 Prevent SMTP overload
          await new Promise(r => setTimeout(r, 1500));

        } catch (mailErr) {
          console.error(
            `❌ Delay alert failed for ${studentName} (${milestone.activity}):`,
            mailErr.message
          );
        }
      }
    }

    /* ===== SAVE LOG FILE ===== */
    const logDir = path.resolve("backend/logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(logDir, "delay-alerts.json"),
      JSON.stringify(logs, null, 2)
    );

    res.json({
      success: true,
      alertsSent: logs.length
    });

  } catch (e) {
    console.error("DELAY ALERT ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});


await sendEmail({
  to: "hazwanihanafi@gmail.com", // MUST be your own email
  subject: "[PPBMS TEST] Email system working",
  text: `
This is a test email.

If you receive this, Resend integration is successful.

— PPBMS System
`,
});

export default router;
