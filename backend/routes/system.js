// backend/routes/system.js
import express from "express";
import { runCQIReminderCheck } from "../jobs/cqiReminderJob.js";

const router = express.Router();

/**
 * SYSTEM: Run CQI reminder check
 * Trigger manually or via scheduler
 */
router.post("/run-cqi-reminder", async (req, res) => {
  try {
    await runCQIReminderCheck();
    res.json({ success: true, message: "CQI reminder check completed" });
  } catch (e) {
    console.error("CQI reminder error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
