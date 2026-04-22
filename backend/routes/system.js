import express from "express";
import {
  readMasterTracking,
  readASSESSMENT_PLO,
  updateASSESSMENT_PLO_Cell
} from "../services/googleSheets.js";
import { extractCQIIssues } from "../utils/detectCQIRequired.js";
import { sendCQIAlert } from "../services/mailer.js";
import { runAutoDelayDetection } from "../jobs/runAutoDelayDetection.js";
import { generateExpectedTimeline } from "../cron/expectedTimeline.js";

const router = express.Router();

/* =========================================================
   🚫 GLOBAL CQI SCAN (ADMIN / MANUAL ONLY)
   DO NOT AUTO-CALL FROM APPS SCRIPT
========================================================= */
router.post("/run-cqi-detection", async (req, res) => {
  try {
    // 🔒 HARD SAFETY GUARD
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        error: "Global CQI scan disabled in production"
      });
    }

    const assessmentRows = await readASSESSMENT_PLO(process.env.SHEET_ID);
    const students = await readMasterTracking(process.env.SHEET_ID);

    const normalized = assessmentRows.map((r, i) => ({
      ...r,
      __rowIndex: i + 2
    }));

    let emailsSent = 0;

    // 🔗 Group by matric + assessment
    const keyMap = {};
    for (const r of normalized) {
      if (!r.matric || !r.assessment_type) continue;

      const key = `${String(r.matric).trim()}_${String(r.assessment_type).trim()}`;
      if (!keyMap[key]) keyMap[key] = [];
      keyMap[key].push(r);
    }

    for (const key in keyMap) {
      const rows = keyMap[key];

      // ⛔ Already emailed
      if (rows.every(r => r["CQI_EMAIL_SENT"] === "YES")) continue;

      const issues = extractCQIIssues(rows);
      if (issues.length === 0) continue;

      const student = students.find(
        s => String(s["Matric"]).trim() === String(rows[0].matric).trim()
      );
      if (!student) continue;

      const supervisorEmail = student["Main Supervisor's Email"];
      if (!supervisorEmail || !supervisorEmail.includes("@")) continue;

      try {
        await sendCQIAlert({
          supervisorEmail,
          studentName: student["Student Name"],
          matric: student["Matric"],
          assessmentType: rows[0].assessment_type,
          cqiIssues: issues
        });

        for (const r of rows) {
          await updateASSESSMENT_PLO_Cell({
            rowIndex: r.__rowIndex,
            column: "CQI_EMAIL_SENT",
            value: "YES"
          });

          await updateASSESSMENT_PLO_Cell({
            rowIndex: r.__rowIndex,
            column: "CQI_EMAIL_DATE",
            value: new Date().toISOString().slice(0, 10)
          });
        }

        emailsSent++;

      } catch (err) {
        console.error("❌ CQI email failed:", err.message);

        for (const r of rows) {
          await updateASSESSMENT_PLO_Cell({
            rowIndex: r.__rowIndex,
            column: "CQI_EMAIL_SENT",
            value: "FAILED"
          });
        }
      }
    }

    res.json({ success: true, emailsSent });

  } catch (e) {
    console.error("CQI trigger error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* =========================================================
   ✅ ROW-LEVEL CQI TRIGGER (ONLY ONE STUDENT)
   THIS IS WHAT APPS SCRIPT MUST CALL
========================================================= */
/* =========================================================
   🎯 ROW-LEVEL CQI TRIGGER (SAFE)
========================================================= */
router.post("/trigger-cqi-row", async (req, res) => {
  try {
    const { rowIndex, matric, assessmentType } = req.body;

    if (!rowIndex || !matric || !assessmentType) {
      return res.status(400).json({ error: "Missing data" });
    }

    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);
    const row = rows[rowIndex - 2]; // Sheet row → array index

    if (!row) {
      return res.json({ skipped: true, reason: "Row not found" });
    }

    // ⛔ Prevent duplicate email
    if (row["CQI_EMAIL_SENT"] === "YES") {
      return res.json({ skipped: true, reason: "Already emailed" });
    }

    // 🔍 Detect CQI ONLY for this row
    const issues = extractCQIIssues([{ ...row }]);
    if (issues.length === 0) {
      return res.json({ skipped: true, reason: "No CQI issues" });
    }

    const students = await readMasterTracking(process.env.SHEET_ID);
    const student = students.find(
      s => String(s["Matric"]).trim() === String(matric).trim()
    );

    if (!student) {
      return res.json({ skipped: true, reason: "Student not found" });
    }

    const supervisorEmail = student["Main Supervisor's Email"];
    if (!supervisorEmail || !supervisorEmail.includes("@")) {
      return res.status(400).json({ error: "Invalid supervisor email" });
    }

    // 📧 SEND EMAIL (single student)
    await sendCQIAlert({
      supervisorEmail,
      studentName: student["Student Name"],
      matric,
      assessmentType,
      cqiIssues: issues
    });

    // ✅ UPDATE SHEET ONLY AFTER SUCCESS
    await updateASSESSMENT_PLO_Cell({
      rowIndex,
      column: "CQI_EMAIL_SENT",
      value: "YES"
    });

    await updateASSESSMENT_PLO_Cell({
      rowIndex,
      column: "CQI_EMAIL_DATE",
      value: new Date().toISOString().slice(0, 10)
    });

    res.json({ success: true });

  } catch (e) {
    console.error("❌ Row CQI email failed:", e);
    res.status(500).json({ error: "Email failed" });
  }
});



/* =========================================================
   🔐 EXTERNAL CRON TRIGGER (SECURE)
========================================================= */
router.post("/run-delay-detection", async (req, res) => {
  const secret = req.headers["x-cron-secret"];

  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    console.log("⏰ External cron triggered delay detection");
    await runAutoDelayDetection();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delay detection failed:", err);
    res.status(500).json({ error: "Delay detection failed" });
  }
});

/* =========================================================
   📅 GENERATE EXPECTED TIMELINE
========================================================= */
router.post("/generate-expected-timeline", async (req, res) => {

  const secret = req.headers["x-cron-secret"];

  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(403).json({
      error: "Forbidden"
    });
  }

  try {

    console.log("📅 Generating expected timeline");

    const result = await generateExpectedTimeline();

    res.json({
      success: true,
      rowsProcessed: result.length
    });

  } catch (err) {

    console.error(
      "❌ Timeline generation failed:",
      err
    );

    res.status(500).json({
      error: err.message
    });
  }
});
export default router;

