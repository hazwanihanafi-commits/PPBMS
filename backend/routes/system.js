import express from "express";
import {
  readMasterTracking,
  readASSESSMENT_PLO,
  updateASSESSMENT_PLO_Cell
} from "../services/googleSheets.js";
import { extractCQIIssues } from "../utils/detectCQIRequired.js";
import { sendCQIAlert } from "../services/mailer.js";

const router = express.Router();

/* =========================================================
   POST /system/run-cqi-detection
   🔥 ONLY CQI trigger point
========================================================= */
router.post("/run-cqi-detection", async (req, res) => {
  try {
    const assessmentRows = await readASSESSMENT_PLO(process.env.SHEET_ID);
    const students = await readMasterTracking(process.env.SHEET_ID);

    const normalized = assessmentRows.map((r, i) => ({
      ...r,
      __rowIndex: i + 2
    }));

    let emailsSent = 0;

    // group by student + assessment
    const keyMap = {};
    for (const r of normalized) {
      const key = `${r.matric}_${r.assessment_type}`;
      if (!keyMap[key]) keyMap[key] = [];
      keyMap[key].push(r);
    }

    for (const key in keyMap) {
      const rows = keyMap[key];

      // 🔒 already emailed → skip
      if (rows.every(r => r.cqiemailsent === "YES")) continue;

      const issues = extractCQIIssues(rows);
      if (issues.length === 0) continue;

      const student = students.find(
        s => String(s["Matric"]).trim() === String(rows[0].matric).trim()
      );
      if (!student) continue;

      await sendCQIAlert({
        to: student["Main Supervisor's Email"],
        studentName: student["Student Name"],
        matric: rows[0].matric,
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
    }

    res.json({ success: true, emailsSent });

  } catch (e) {
    console.error("CQI trigger error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/trigger-cqi-row", async (req, res) => {
  try {
    const { matric, assessmentType, rowIndex } = req.body;

    if (!matric || !assessmentType || !rowIndex) {
      return res.status(400).json({ error: "Missing data" });
    }

    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    const row = rows[rowIndex - 2]; // sheet row → array index
    if (!row) return res.json({ skipped: true });

    // Detect CQI ONLY for this row
    const issues = extractCQIIssues([{ ...row, __rowIndex: rowIndex }]);

    if (issues.length === 0) {
      return res.json({ skipped: true });
    }

    // Prevent duplicate email
    if (row.cqiemailsent === "YES") {
      return res.json({ skipped: true });
    }

    const students = await readMasterTracking(process.env.SHEET_ID);
    const student = students.find(
      s => String(s["Matric"]).trim() === String(matric).trim()
    );

    if (!student) return res.json({ skipped: true });

    await sendCQIAlert({
      to: student["Main Supervisor's Email"],
      studentName: student["Student Name"],
      matric,
      assessmentType,
      cqiIssues: issues
    });

    await updateASSESSMENT_PLO_Cell({
      rowIndex,
      column: "CQI_EMAIL_SENT",
      value: "YES"
    });

    await updateASSESSMENT_PLO_Cell({
      rowIndex,
      column: "CQI_DATE",
      value: new Date().toISOString().slice(0, 10)
    });

    res.json({ success: true });
  } catch (e) {
    console.error("Row CQI trigger error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
