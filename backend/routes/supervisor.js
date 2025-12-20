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
   (MUST MATCH student.js)
========================= */
const DOC_COLUMN_MAP = {
  // Monitoring & Supervision
  "Development Plan & Learning Contract (DPLC)": "DPLC",
  "Student Supervision Logbook": "SUPERVISION_LOG",
  "Annual Progress Review – Year 1": "APR_Y1",
  "Annual Progress Review – Year 2": "APR_Y2",
  "Annual Progress Review – Year 3 (Final Year)": "APR_Y3",

  // Ethics & Research Outputs
  "Ethics Approval": "ETHICS_APPROVAL",
  "Publication Acceptance": "PUBLICATION_ACCEPTANCE",
  "Proof of Submission": "PROOF_OF_SUBMISSION",
  "Conference Presentation": "CONFERENCE_PRESENTATION",

  // Thesis & Viva
  "Thesis Notice": "THESIS_NOTICE",
  "Viva Report": "VIVA_REPORT",
  "Correction Verification": "CORRECTION_VERIFICATION",
  "Final Thesis": "FINAL_THESIS",
};

/* ============================================================
   GET /api/supervisor/students
   → LIST SUPERVISED STUDENTS
============================================================ */
router.get("/students", auth, async (req, res) => {
  try {
    const supervisorEmail = (req.user.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const students = rows
      .filter(r => {
        const sup = (r["Main Supervisor's Email"] || "").toLowerCase().trim();
        return sup === supervisorEmail;
      })
      .map(r => ({
        id: r["Matric"] || "",
        name: r["Student Name"] || "",
        email: (r["Student's Email"] || "").toLowerCase().trim(),
        programme: r["Programme"] || ""
      }));

    res.json({ students });
  } catch (e) {
    console.error("supervisor students error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   GET /api/supervisor/student/:email
   → FULL STUDENT VIEW (PROFILE + DOCUMENTS + TIMELINE + CQI)
============================================================ */
router.get("/student/:email", auth, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    /* ---------- MASTER TRACKING ---------- */
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

    /* ---------- DOCUMENTS (✅ FIXED) ---------- */
    const documents = {};
    Object.entries(DOC_COLUMN_MAP).forEach(([label, column]) => {
      documents[label] = raw[column] || "";
    });

    /* ---------- TIMELINE ---------- */
    const timeline = buildTimelineForRow(raw);

/* ---------- CQI (TRX500) ---------- */
const assessments = await readASSESSMENT_PLO(process.env.SHEET_ID);

const studentMatric = String(raw["Matric"] || "").trim();

const trxAssessments = assessments.filter(a => {
  const matric =
    String(a["Matric"] || "")
      .trim();

  const assessmentType =
    String(a["assessment_type"] || "")
      .toUpperCase()
      .trim();

  return (
    matric === studentMatric &&
    assessmentType === "TRX500"
  );
});

// 🔍 DEBUG (optional, remove later)
console.log("TRX500 MATCHED ROWS:", trxAssessments.length);

// ✅ CLEAN PLO VALUES
const trxAssessmentsClean = trxAssessments.map(a => {
  const clean = {};
  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;
    const val = parseFloat(a[key]);
    clean[key] = isNaN(val) ? null : val;
  }
  return clean;
});

console.log("TRX500 MATCHED ROWS:", trxAssessments.length);
console.log("TRX500 ROW SAMPLE:", trxAssessments[0]);
    
// ✅ CQI CALCULATION
const cqiByAssessment = deriveCQIByAssessment(trxAssessmentsClean);

// 🔍 DEBUG (optional)
console.log("CQI RESULT:", cqiByAssessment);
    
    /* ---------- RESPONSE ---------- */
    res.json({
      row: {
        ...profile,
        documents,           // ✅ NOW POPULATED
        timeline,
        cqiByAssessment
      }
    });

  } catch (e) {
    console.error("supervisor student detail error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
