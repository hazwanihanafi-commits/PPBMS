import express from "express";
import jwt from "jsonwebtoken";

import {
  readMasterTracking,
  readASSESSMENT_PLO,
  updateASSESSMENT_PLO_Remark,
  updateASSESSMENT_PLO_Cell
} from "../services/googleSheets.js";

import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { aggregateFinalPLO } from "../utils/finalPLOAggregate.js";
import { extractCQIIssues } from "../utils/detectCQIRequired.js";
import { sendCQIAlert } from "../services/mailer.js";

const router = express.Router();

/* =========================================================
   DOCUMENT COLUMN MAP (MasterTracking)
========================================================= */
const DOC_COLUMN_MAP = {
  "Development Plan & Learning Contract (DPLC)": "DPLC",
  "Student Supervision Logbook": "SUPERVISION_LOG",
  "Annual Progress Review – Year 1": "APR_Y1",
  "Annual Progress Review – Year 2": "APR_Y2",
  "Annual Progress Review – Year 3 (Final Year)": "APR_Y3",
  "Ethics Approval": "ETHICS_APPROVAL",
  "Publication Acceptance": "PUBLICATION_ACCEPTANCE",
  "Proof of Submission": "PROOF_OF_SUBMISSION",
  "Conference Presentation": "CONFERENCE_PRESENTATION",
  "Thesis Notice": "THESIS_NOTICE",
  "Viva Report": "VIVA_REPORT",
  "Correction Verification": "CORRECTION_VERIFICATION",
  "Final Thesis": "FINAL_THESIS",
};

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
   GET /api/supervisor/students
   → Supervisor Dashboard List
========================================================= */
router.get("/students", auth, async (req, res) => {
  try {
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const loginEmail = (req.user.email || "")
      .toLowerCase()
      .replace(/\s+/g, "");

    const students = rows
      .filter(r => {
        if (req.user.role === "admin") return true;

        const supervisorEmail = (r["Main Supervisor's Email"] || "")
          .toLowerCase()
          .replace(/\s+/g, "");

        return supervisorEmail.includes(loginEmail);
      })
      .map(r => {
        const timeline = buildTimelineForRow(r);
        const completed = timeline.filter(t => t.status === "Completed").length;

        return {
          id: r["Matric"] || "",
          name: r["Student Name"] || "",
          email: (r["Student's Email"] || "").toLowerCase().trim(),
          programme: r["Programme"] || "",
          field: r["Field"] || "",
          status: r["Status"] || "Active",
          progressPercent: timeline.length
            ? Math.round((completed / timeline.length) * 100)
            : 0
        };
      });

    res.json({ students });
  } catch (e) {
    console.error("students list error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* =========================================================
   GET /api/supervisor/student/:email
========================================================= */
router.get("/student/:email", auth, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();
    const masterRows = await readMasterTracking(process.env.SHEET_ID);

    const raw = masterRows.find(
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

    /* ---------- DOCUMENTS ---------- */
    const documents = {};
    Object.entries(DOC_COLUMN_MAP).forEach(([label, column]) => {
      documents[label] = raw[column] || "";
    });

    /* ---------- READ ASSESSMENT_PLO ---------- */
    const assessmentRows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    const normalized = assessmentRows.map((r, i) => ({
      ...r,
      __rowIndex: i + 2
    }));

    const matric = String(raw["Matric"]).trim();
    const studentRows = normalized.filter(
      r => String(r.matric || r.matricno || "").trim() === matric
    );

    /* ---------- GROUP BY ASSESSMENT ---------- */
    const grouped = {};
    studentRows.forEach(r => {
      const type = String(r.assessment_type || "").toUpperCase();
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(r);
    });

    /* ---------- CQI BY ASSESSMENT (MEASURED ONLY) ---------- */
    const cqiByAssessment = {};
    const remarksByAssessment = {};

    Object.entries(grouped).forEach(([assessment, rows]) => {
      const ploResult = {};

      for (let i = 1; i <= 11; i++) {
        const values = rows
          .map(r => r[`plo${i}`])
          .filter(v => typeof v === "number");

        if (values.length === 0) continue;

        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        ploResult[`PLO${i}`] = {
          average: Number(avg.toFixed(2)),
          status: avg >= 3 ? "Achieved" : "CQI Required"
        };
      }

      if (Object.keys(ploResult).length > 0) {
        cqiByAssessment[assessment] = ploResult;
      }

      const remarkRow = rows.find(r => r.remarks && r.remarks.trim());
      if (remarkRow) remarksByAssessment[assessment] = remarkRow.remarks;
    });

    /* ---------- FINAL PLO (PROGRAMME LEVEL) ---------- */
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
        documents,
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
========================================================= */
router.post("/remark", auth, async (req, res) => {
  try {
    const { studentMatric, assessmentType, remark } = req.body;
    if (!studentMatric || !assessmentType)
      return res.status(400).json({ error: "Missing data" });

    await updateASSESSMENT_PLO_Remark({
      studentMatric,
      assessmentType,
      remark
    });

    const students = await readMasterTracking(process.env.SHEET_ID);
    const student = students.find(
      r => String(r["Matric"]).trim() === String(studentMatric).trim()
    );
    if (!student) return res.json({ success: true });

    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);
    const normalized = rows.map((r, i) => ({
      ...r,
      __rowIndex: i + 2
    }));

    const studentRows = normalized.filter(
      r =>
        String(r.matric || r.matricno || "").trim() === studentMatric &&
        String(r.assessment_type || "").toUpperCase() === assessmentType.toUpperCase()
    );

    const issues = extractCQIIssues(studentRows);
    const needEmail =
      issues.length > 0 &&
      studentRows.some(r => r.cqiemailsent !== "YES");

    if (needEmail) {
      await sendCQIAlert({
        to: student["Main Supervisor's Email"],
        studentName: student["Student Name"],
        matric: studentMatric,
        assessmentType,
        cqiIssues: issues,
        remark
      });

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
