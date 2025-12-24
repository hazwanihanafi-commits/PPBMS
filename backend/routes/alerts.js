import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { detectDelays } from "../utils/detectDelays.js";
import { sendDelayAlert } from "../services/mailer.js";
import fs from "fs";

const router = express.Router();

router.post("/run-delay-alert", async (req, res) => {
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

  fs.writeFileSync(
    "backend/logs/delay-alerts.json",
    JSON.stringify(logs, null, 2)
  );

  res.json({ success: true, alertsSent: logs.length });
});

export default router;
