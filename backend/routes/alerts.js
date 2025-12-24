import express from "express";
import fs from "fs";
import path from "path";

import { readMasterTracking } from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { detectDelays } from "../utils/detectDelays.js";
import { sendDelayAlert } from "../services/mailer.js";

const router = express.Router();

/* ================= LOG STORAGE ================= */
const LOG_DIR = path.join(process.cwd(), "backend", "logs");
const LOG_FILE = path.join(LOG_DIR, "delay-alerts.json");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/* ================= RUN ALERT ================= */
router.post("/run-delay-alert", async (req, res) => {
  try {
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const logs = [];

    for (const row of rows) {
      const timeline = buildTimelineForRow(row);
      const delays = detectDelays(timeline);

      if (!delays.length) continue;

      const supervisorEmail = row["Main Supervisor's Email"];
      if (!supervisorEmail) continue;

      await sendDelayAlert({
        to: supervisorEmail,
        student: row["Student Name"],
        delays,
      });

      logs.push({
        student: row["Student Name"],
        supervisor: supervisorEmail,
        delays: delays.map(d => d.activity),
        date: new Date().toISOString(),
      });
    }

    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));

    return res.json({
      success: true,
      alertsSent: logs.length,
    });

  } catch (err) {
    console.error("DELAY ALERT ERROR:", err);
    return res.status(500).json({ error: "Delay alert failed" });
  }
});

export default router;
