import express from "express";
import jwt from "jsonwebtoken";

import {
  readMasterTracking,
  readASSESSMENT_PLO
} from "../services/googleSheets.js";

import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { deriveCQIByAssessment } from "../utils/cqiAggregate.js";

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
   CQI (ALL ASSESSMENTS)
========================= */

/* 1️⃣ Read ASSESSMENT_PLO sheet */
const assessments = await readASSESSMENT_PLO(process.env.SHEET_ID);

/* 2️⃣ Student identifiers */
const studentMatric = String(raw["Matric"] || "").trim();
const studentEmail = String(raw["Student's Email"] || "")
  .toLowerCase()
  .trim();

/* 🔍 DEBUG */
console.log("STUDENT MATRIC:", studentMatric);
console.log("STUDENT EMAIL:", studentEmail);
console.log("TOTAL ASSESSMENT ROWS:", assessments.length);

/* 3️⃣ Filter rows for THIS student */
const studentAssessments = assessments.filter(a => {
  const matric = String(a["Matric"] || "").trim();
  const email = String(a["Student's Email"] || "").toLowerCase().trim();

  return matric === studentMatric || email === studentEmail;
});

/* 🔍 DEBUG */
console.log("STUDENT ASSESSMENT ROWS:", studentAssessments.length);

/* 4️⃣ Group by assessment_type (TRX500, VIVA, etc.) */
const grouped = {};

studentAssessments.forEach(row => {
  const type = String(row["assessment_type"] || "")
    .toUpperCase()
    .trim();

  if (!type) return;

  if (!grouped[type]) grouped[type] = [];

  const clean = {};
  for (let i = 1; i <= 11; i++) {
    const v = parseFloat(row[`PLO${i}`]);
    clean[`PLO${i}`] = isNaN(v) ? null : v;
  }

  grouped[type].push(clean);
});

/* 🔍 DEBUG */
console.log("GROUPED ASSESSMENTS:", Object.keys(grouped));

/* 5️⃣ Calculate CQI per assessment */
const cqiByAssessment = {};

Object.entries(grouped).forEach(([type, rows]) => {
  cqiByAssessment[type] = deriveCQIByAssessment(rows);
});

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
    

} catch (e) {
  console.error("supervisor student detail error:", e);
  return res.status(500).json({ error: e.message });
}
});

/* =========================
   EXPORT (ONLY ONCE)
========================= */
export default router;
