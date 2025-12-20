import express from "express";
import jwt from "jsonwebtoken";

import {
  readMasterTracking,
  readASSESSMENT_PLO
} from "../services/googleSheets.js";

import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { deriveCQIByAssessment } from "../utils/cqiAggregate.js";
import { writeSheetCell } from "../services/googleSheets.js";

const router = express.Router();

/* =========================
   AUTH MIDDLEWARE
========================= */
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* =========================
   DOCUMENT → COLUMN MAP
========================= */
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

/* ============================================================
   GET /api/supervisor/students
============================================================ */
router.get("/students", auth, async (req, res) => {
  try {
    const supervisorEmail = (req.user.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const students = rows
      .filter(r =>
        (r["Main Supervisor's Email"] || "")
          .toLowerCase()
          .trim() === supervisorEmail
      )
      .map(r => ({
        id: r["Matric"] || "",
        name: r["Student Name"] || "",
        email: (r["Student's Email"] || "").toLowerCase().trim(),
        programme: r["Programme"] || ""
      }));

    return res.json({ students });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   GET /api/supervisor/student/:email
============================================================ */
router.get("/student/:email", auth, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    const rows = await readMasterTracking(process.env.SHEET_ID);
    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) {
      return res.status(404).json({ error: "Student not found" });
    }

    /* ---------- PROFILE ---------- */
    const profile = {
      student_id: raw["Matric"] || "",
      student_name: raw["Student Name"] || "",
      email,
      programme: raw["Programme"] || "",
      field: raw["Field"] || "",
      department: raw["Department"] || ""
    };

    /* ---------- DOCUMENTS ---------- */
    const documents = {};
    Object.entries(DOC_COLUMN_MAP).forEach(([label, col]) => {
      documents[label] = raw[col] || "";
    });

    /* ---------- TIMELINE ---------- */
    const timeline = buildTimelineForRow(raw);

/* =========================
   CQI (TRX500 + VIVA) — FINAL
========================= */

const assessmentsRaw = await readASSESSMENT_PLO(process.env.SHEET_ID);

/* 🔑 Normalize headers (remove spaces, lowercase) */
const assessments = assessmentsRaw.map(row => {
  const clean = {};
  Object.keys(row).forEach(k => {
    clean[k.replace(/\s+/g, "").toLowerCase()] = row[k];
  });
  return clean;
});

/* Student identifiers */
const studentMatric = String(raw["Matric"] || "").trim();
const studentEmail = String(raw["Student's Email"] || "").toLowerCase().trim();

/* 🔍 DEBUG */
console.log("STUDENT MATRIC:", studentMatric);
console.log("STUDENT EMAIL:", studentEmail);
console.log("TOTAL ASSESSMENT ROWS:", assessments.length);

/* 🔎 Filter student's rows (ALL assessments) */
const studentRows = assessments.filter(a => {
  const matric = String(a["matric"] || "").trim();
  const email = String(a["studentsemail"] || "").toLowerCase().trim();

  return matric === studentMatric || email === studentEmail;
});

console.log("STUDENT ASSESSMENT ROWS:", studentRows.length);

/* 🔁 Group by assessment_type (TRX500, VIVA, etc.) */
const grouped = {};
studentRows.forEach(r => {
  const type = String(r["assessment_type"] || "").toUpperCase().trim();
  if (!type) return;

  if (!grouped[type]) grouped[type] = [];
  grouped[type].push(r);
});

console.log("GROUPED ASSESSMENTS:", Object.keys(grouped));

/* 📊 Compute CQI per assessment */
const cqiByAssessment = {};

for (const [type, rows] of Object.entries(grouped)) {
  const cleanPLO = rows.map(r => {
    const o = {};
    for (let i = 1; i <= 11; i++) {
      const v = parseFloat(r[`plo${i}`]);
      o[`PLO${i}`] = isNaN(v) ? null : v;
    }
    return o;
  });

  cqiByAssessment[type] = deriveCQIByAssessment(cleanPLO);
}

/* 🔍 FINAL DEBUG */
console.log("CQI RESULT SENT:", cqiByAssessment);
    
/* =========================
   RESPONSE
========================= */
return res.json({
  row: {
    ...profile,
    documents,
    timeline,
    cqiByAssessment
  }
});

/* ============================================================
   POST /api/supervisor/remark
   → Save supervisor remark to ASSESSMENT_PLO
============================================================ */
router.post("/remark", auth, async (req, res) => {
  try {
    const { studentMatric, assessmentType, remark } = req.body;

    if (!studentMatric || !assessmentType) {
      return res.status(400).json({ error: "Missing data" });
    }

    await updateASSESSMENT_PLO_Remark({
      studentMatric,
      assessmentType,
      remark
    });

    return res.json({ success: true });

  } catch (e) {
    console.error("save remark error:", e);
    return res.status(500).json({ error: e.message });
  }
});

/* =========================
   EXPORT (ONLY ONCE)
========================= */
export default router;
