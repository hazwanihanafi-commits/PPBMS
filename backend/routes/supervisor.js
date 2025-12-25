import express from "express";
import jwt from "jsonwebtoken";

import {
  readMasterTracking,
  readASSESSMENT_PLO,
  updateASSESSMENT_PLO_Remark,
  updateASSESSMENT_PLO_Cell
} from "../services/googleSheets.js";

import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { deriveCQIByAssessment } from "../utils/cqiAggregate.js";
import { aggregateFinalPLO } from "../utils/finalPLOAggregate.js";
import { extractCQIIssues } from "../utils/detectCQIRequired.js";
import { sendCQIAlert } from "../services/mailer.js";

const router = express.Router();

/* =========================================================
   AUTH (ADMIN + SUPERVISOR)
========================================================= */
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (!["admin", "supervisor"].includes(user.role)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* =========================================================
   GET /api/supervisor/student/:email
========================================================= */
router.get("/student/:email", auth, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );
    if (!raw) return res.status(404).json({ error: "Student not found" });

    /* ---------- PROFILE ---------- */
    const profile = {
      student_id: raw["Matric"] || "",
      student_name: raw["Student Name"] || "",
      email,
      programme: raw["Programme"] || "",
      field: raw["Field"] || "",
      department: raw["Department"] || "",
      status: raw["Status"] || "Active",
      coSupervisors: raw["Co-Supervisor(s)"]
        ? raw["Co-Supervisor(s)"]
            .split(/\d+\.\s*/g)
            .map(s => s.trim())
            .filter(Boolean)
        : []
    };

    /* ---------- TIMELINE ---------- */
    const timeline = buildTimelineForRow(raw);

    /* ---------- CQI + REMARKS ---------- */
    const assessmentRows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    const normalized = assessmentRows.map((r, i) => {
      const clean = {};
      Object.keys(r).forEach(k => {
        clean[k.replace(/\s+/g, "").toLowerCase()] = r[k];
      });
      clean.__rowIndex = i + 2;
      return clean;
    });

    const matric = String(raw["Matric"]).trim();
    const studentRows = normalized.filter(
      r => String(r.matric || r.matricno || "").trim() === matric
    );

    const grouped = {};
    studentRows.forEach(r => {
      const type = String(r.assessment_type || "").toUpperCase();
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(r);
    });

    const cqiByAssessment = {};
    const remarksByAssessment = {};

    Object.entries(grouped).forEach(([type, rows]) => {
      const ploScores = rows.map(r => {
        const o = {};
        for (let i = 1; i <= 11; i++) {
          const v = Number(r[`plo${i}`]);
          o[`PLO${i}`] = isNaN(v) ? null : v;
        }
        return o;
      });

      cqiByAssessment[type] = deriveCQIByAssessment(ploScores);

      const remarkRow = rows.find(r => r.remarks && r.remarks.trim());
      if (remarkRow) remarksByAssessment[type] = remarkRow.remarks;
    });

    const finalPLO = aggregateFinalPLO(cqiByAssessment);

    for (let i = 1; i <= 11; i++) {
      if (!finalPLO[`PLO${i}`]) {
        finalPLO[`PLO${i}`] = { average: null, status: "Not Assessed" };
      }
    }

    res.json({
      row: {
        ...profile,
        timeline,
        cqiByAssessment,
        finalPLO,
        remarksByAssessment
      }
    });
  } catch (e) {
    console.error("Supervisor student error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* =========================================================
   POST /api/supervisor/remark
   → Save remark
   → Trigger CQI email (SUPERVISOR)
========================================================= */
router.post("/remark", auth, async (req, res) => {
  try {
    const { studentMatric, assessmentType, remark } = req.body;
    if (!studentMatric || !assessmentType)
      return res.status(400).json({ error: "Missing data" });

    /* 1️⃣ Save remark */
    await updateASSESSMENT_PLO_Remark({
      studentMatric,
      assessmentType,
      remark
    });

    /* 2️⃣ Load student */
    const students = await readMasterTracking(process.env.SHEET_ID);
    const student = students.find(
      r => String(r["Matric"]).trim() === String(studentMatric).trim()
    );
    if (!student) return res.json({ success: true });

    /* 3️⃣ Load assessment rows */
    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);
    const normalized = rows.map((r, i) => ({
      ...r,
      __rowIndex: i + 2
    }));

    const studentRows = normalized.filter(
      r =>
        String(r.matric || r.matricno || "").trim() === String(studentMatric).trim() &&
        String(r.assessment_type || "").toUpperCase() === assessmentType.toUpperCase()
    );

    /* 4️⃣ CQI detection */
    const issues = extractCQIIssues(studentRows);
    const needEmail =
      issues.length > 0 &&
      studentRows.some(r => r.cqiemailsent !== "YES");

    /* 5️⃣ Send email to SUPERVISOR ONLY */
    if (needEmail) {
      await sendCQIAlert({
        to: student["Main Supervisor's Email"],
        studentName: student["Student Name"],
        matric: studentMatric,
        assessmentType,
        cqiIssues: issues,
        remark
      });

      /* 6️⃣ Mark CQI_EMAIL_SENT */
      for (const r of studentRows) {
        if (r.cqiemailsent !== "YES") {
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
      }
    }

    res.json({ success: true, emailTriggered: needEmail });
  } catch (e) {
    console.error("CQI remark error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
