import express from "express";
import { runDelayAlert } from "../jobs/delayAlertJob.js";

const router = express.Router();

router.post("/run-delay-alert", async (req, res) => {
  await runDelayAlert();
  res.json({ status: "Delay alert job executed" });
});

export default router;
