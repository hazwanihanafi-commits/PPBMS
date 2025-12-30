import express from "express";
import fs from "fs";
import path from "path";

import {
  readMasterTracking,
  writeSheetCell
} from "../services/googleSheets.js";

import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { sendDelayAlert } from "../services/mailer.js";
import sendEmail from "../services/sendEmail.js";

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
      const rowIndex = i + 2;

      const timeline = buildTimelineForRow(row);
      const lateMilestones = timeline.filter(t => t.status === "Late");

      if (!lateMilestones.length) continue;

      const studentName = row["Student Name"];
      const studentEmail = row["Student's Email"];
      const supervisorEmail = row["Main Supervisor's Email"];
      const adminEmail = process.env.ADMIN_EMAIL;

      if (!studentEmail || !supervisorEmail) continue;

      for (const milestone of lateMilestones) {
        const remarkColumn = `${milestone.activity} - Remark`;
        const existingRemark = row[remarkColumn];

        if (existingRemark === "DELAY_EMAIL_SENT") continue;

        try {
          await sendDelayAlert({
            studentName,
            studentEmail,
            supervisorEmail,
            adminEmails: [adminEmail],
            delays: [milestone]
          });

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
            daysLate: Math.abs(milestone.remaining_days),
            emailedAt: new Date().toISOString()
          });

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

    res.json({ success: true, alertsSent: logs.length });

  } catch (e) {
    console.error("DELAY ALERT ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

/* =====================================================
   POST /alerts/test-email
   ✔ MANUAL EMAIL TEST (SAFE)
===================================================== */
router.post("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: "hazwanihanafi@gmail.com",
      subject: "[PPBMS TEST] Email system working",
      text: `
This is a test email.

If you receive this, Resend integration is successful.

— PPBMS System
`,
    });

    res.json({ success: true, message: "Test email sent" });

  } catch (err) {
    console.error("TEST EMAIL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
