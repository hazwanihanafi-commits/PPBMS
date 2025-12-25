import express from "express";
import fs from "fs";
import path from "path";

import { readMasterTracking } from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { sendDelayAlert } from "../services/mailer.js";

const router = express.Router();

/* =====================================================
   POST /alerts/run-delay-alert
===================================================== */
router.post("/run-delay-alert", async (req, res) => {
  try {
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const logs = [];

    for (const row of rows) {
      const timeline = buildTimelineForRow(row);

      const delays = timeline.filter(
        t => t.status === "Late"
      );

      if (!delays.length) continue;

      const supervisorEmail = row["Main Supervisor's Email"];
      if (!supervisorEmail) continue;

      /* ===== SEND EMAIL (THROTTLED) ===== */
      try {
        await sendDelayAlert({
          to: supervisorEmail,
          student: row["Student Name"],
          delays,
        });

        logs.push({
          student: row["Student Name"],
          supervisor: supervisorEmail,
          delayedActivities: delays.map(d => d.activity),
          date: new Date().toISOString(),
        });

        // 🔑 PREVENT SMTP SOCKET DROP
        await new Promise(r => setTimeout(r, 1500));

      } catch (mailErr) {
        console.error(
          `❌ Delay alert failed for ${row["Student Name"]}:`,
          mailErr.message
        );
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
      alertsSent: logs.length,
    });

  } catch (e) {
    console.error("DELAY ALERT ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
