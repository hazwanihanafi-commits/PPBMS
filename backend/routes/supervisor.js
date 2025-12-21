import express from "express";
import jwt from "jsonwebtoken";

import {
  readMasterTracking,
  readASSESSMENT_PLO,
  updateASSESSMENT_PLO_Remark
} from "../services/googleSheets.js";

import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { deriveCQIByAssessment } from "../utils/cqiAggregate.js";
import { aggregateFinalPLO } from "../utils/finalPLOAggregate.js";

const router = express.Router();

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
   → Dashboard list + progress %
========================================================= */
router.get("/students", auth, async (req, res) => {
  try {
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const loginEmail = (req.user.email || "").toLowerCase().trim();

    const students = rows
      .filter(r =>
        req.user.role === "admin"
          ? true
          : (r["Main Supervisor's Email"] || "")
              .toLowerCase()
              .trim() === loginEmail
      )
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
          coSupervisors: r["Co-Supervisor(s)"] || "",
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
   → FULL CQI + FINAL PLO VIEW
========================================================= */
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

    /* ---------- CO-SUPERVISOR NORMALISATION ---------- */
const rawCoSup = raw["Co-Supervisor(s)"] || "";
const coSupervisors = rawCoSup
  ? rawCoSup
      .split(/\d+\.\s*/g)   // handles "1. Name 2. Name"
      .map(s => s.trim())
      .filter(Boolean)
  : [];

    

    /* ---------- PROFILE ---------- */
    const profile = {
  student_id: raw["Matric"] || "",
  student_name: raw["Student Name"] || "",
  email,
  programme: raw["Programme"] || "",
  field: raw["Field"] || "",
  department: raw["Department"] || "",
  status: raw["Status"] || "Active",
  coSupervisors // ✅ ARRAY
};

    /* ---------- DOCUMENTS ---------- */
const documents = {};
Object.entries(DOC_COLUMN_MAP).forEach(([label, column]) => {
  documents[label] = raw[column] || "";
});

    /* ---------- TIMELINE ---------- */
    const timeline = buildTimelineForRow(raw);

    /* ---------- CQI + REMARKS ---------- */
    const assessmentRows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    const normalized = assessmentRows.map(r => {
      const clean = {};
      Object.keys(r).forEach(k => {
        clean[k.replace(/\s+/g, "").toLowerCase()] = r[k];
      });
      return clean;
    });

    const matric = String(raw["Matric"] || "").trim();
    const studentRows = normalized.filter(r => {
  const m =
    String(r["matric"] || r["matricno"] || "").trim();
  return m === matric;
});
    

    const grouped = {};
    studentRows.forEach(r => {
      const type = String(r["assessment_type"] || "").toUpperCase();
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(r);
    });

    const cqiByAssessment = {};
    const remarksByAssessment = {};

    Object.entries(grouped).forEach(([type, rows]) => {
      const ploScores = rows.map(r => {
        const o = {};
        for (let i = 1; i <= 11; i++) {
          const v = parseFloat(r[`plo${i}`]);
          o[`PLO${i}`] = isNaN(v) ? null : v;
        }
        return o;
      });

      cqiByAssessment[type] = deriveCQIByAssessment(ploScores);

      const remarkRow = rows.find(r => r.remarks && r.remarks.trim());
      if (remarkRow) remarksByAssessment[type] = remarkRow.remarks;
    });

    /* ---------- FINAL PLO (ALL ASSESSMENTS) ---------- */
    const finalPLO = aggregateFinalPLO(cqiByAssessment);

    res.json({
      row: {
        ...profile,
        documents,
        timeline,
        cqiByAssessment,
        finalPLO,
        remarksByAssessment
      }
    });
  } catch (e) {
    console.error("student detail error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* =========================================================
   POST /api/supervisor/remark
========================================================= */
router.post("/remark", auth, async (req, res) => {
  try {
    const { studentMatric, assessmentType, remark } = req.body;

    if (!studentMatric || !assessmentType) {
      return res.status(400).json({ error: "Missing data" });
    }

    if (!remark || !remark.trim()) {
      return res.json({ success: true });
    }

    await updateASSESSMENT_PLO_Remark({
      studentMatric,
      assessmentType,
      remark
    });

    res.json({ success: true });
  } catch (e) {
    console.error("save remark error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
