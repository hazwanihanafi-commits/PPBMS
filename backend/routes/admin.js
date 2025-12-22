import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet, resetSheetCache } from "../utils/sheetCache.js";
import { readMasterTracking, writeSheetCell } from "../services/googleSheets.js";
import { aggregateProgrammePLO } from "../utils/programmePLOAggregate.js";

const router = express.Router();

/* ================= ADMIN AUTH ================= */
function adminOnly(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    if (data.role !== "admin") {
      return res.status(401).json({ error: "Admin only" });
    }
    req.user = data;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ================= DOCUMENT MAP ================= */
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

/* ================= ALL STUDENTS ================= */
router.get("/all-students", adminOnly, async (req, res) => {
  const rows = await getCachedSheet(process.env.SHEET_ID);
  res.json({ students: rows });
});

/* ================= AT RISK ================= */
router.get("/at-risk", adminOnly, async (req, res) => {
  const rows = await getCachedSheet(process.env.SHEET_ID);
  const today = new Date();
  const atRisk = [];

  rows.forEach(row => {
    const late = [];

    Object.keys(row).forEach(col => {
      if (col.endsWith(" - Expected")) {
        const act = col.replace(" - Expected", "");
        if (row[col] && !row[`${act} - Actual`]) {
          if (new Date(row[col]) < today) {
            late.push({ activity: act, expected: row[col] });
          }
        }
      }
    });

    if (late.length > 0) {
      atRisk.push({
        name: row["Student Name"],
        email: row["Student's Email"],
        supervisor: row["Main Supervisor"],
        lateActivities: late
      });
    }
  });

  res.json({ atRisk });
});

/* ================= SINGLE STUDENT ================= */
router.get("/student/:email", adminOnly, async (req, res) => {
  const email = req.params.email.toLowerCase();
  const rows = await readMasterTracking(process.env.SHEET_ID);

  const raw = rows.find(
    r => (r["Student's Email"] || "").toLowerCase() === email
  );

  if (!raw) return res.status(404).json({ error: "Student not found" });

  /* -------- Documents -------- */
  const documents = {};
  Object.entries(DOC_COLUMN_MAP).forEach(([label, col]) => {
    documents[label] = raw[col] || "";
  });

  /* -------- Co-Supervisor Normalisation -------- */
  const rawCoSup = raw["Co-Supervisor(s)"] || "";
  const coSupervisors = rawCoSup
    ? rawCoSup
        .split(/\d+\.\s*/g) // split "1. Name 2. Name"
        .map(s => s.trim())
        .filter(Boolean)
    : [];

  res.json({
    row: {
      student_name: raw["Student Name"],
      email: raw["Student's Email"],
      programme: raw["Programme"],
      department: raw["Department"],

      status: raw["Status"] || "Active",
      coSupervisors,                 // ✅ array, clean

      documents
    }
  });
});

/* ================= SAVE / REMOVE DOCUMENT ================= */
router.post("/save-document", adminOnly, async (req, res) => {
  const { student_email, document_type, file_url } = req.body;

  const column = DOC_COLUMN_MAP[document_type];
  if (!column) return res.status(400).json({ error: "Invalid document type" });

  const rows = await readMasterTracking(process.env.SHEET_ID);
  const idx = rows.findIndex(
    r => (r["Student's Email"] || "").toLowerCase() === student_email.toLowerCase()
  );

  if (idx === -1) return res.status(404).json({ error: "Student not found" });

  await writeSheetCell(
    process.env.SHEET_ID,
    column,
    idx + 2,               // +2 because header + 1-based index
    file_url || ""
  );

  resetSheetCache();
  res.json({ ok: true });
});

/* =========================================================
   GET /api/admin/plo/programme
   → Programme-level PLO attainment (ALL students)
========================================================= */
router.get("/plo/programme", adminOnly, async (req, res) => {
  try {
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const assessmentRows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    // Normalise assessment rows
    const normalized = assessmentRows.map(r => {
      const clean = {};
      Object.keys(r).forEach(k => {
        clean[k.replace(/\s+/g, "").toLowerCase()] = r[k];
      });
      return clean;
    });

    const studentFinalPLOs = [];

    rows.forEach(student => {
      const matric = String(student["Matric"] || "").trim();
      if (!matric) return;

      const studentRows = normalized.filter(
        r => String(r.matric || "").trim() === matric
      );

      if (studentRows.length === 0) return;

      const grouped = {};
      studentRows.forEach(r => {
        const type = String(r.assessment_type || "").toUpperCase();
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(r);
      });

      const cqiByAssessment = {};
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
      });

      const finalPLO = aggregateFinalPLO(cqiByAssessment);
      studentFinalPLOs.push(finalPLO);
    });

    const programmePLO = aggregateProgrammePLO(studentFinalPLOs);

    res.json({ programmePLO });
  } catch (e) {
    console.error("programme PLO error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ============================================
   PROGRAMME PLO DASHBOARD (ADMIN)
===============================================*/
router.get("/programme-plo", adminOnly, async (req, res) => {
  try {
    const { programme, cohort, status } = req.query;

    const rows = await readMasterTracking(process.env.SHEET_ID);
    const norm = (v) => (v || "").toString().trim();

    const filtered = rows.filter(r => {
      if (programme && norm(r["Programme"]) !== programme) return false;
      if (cohort && norm(r["Intake Year"]) !== cohort) return false;
      if (status && norm(r["Status"]) !== status) return false;
      return true;
    });

    const ploKeys = ["PLO1","PLO2","PLO3","PLO4","PLO5","PLO6","PLO7","PLO8"];
    const totals = {};
    const counts = {};

    ploKeys.forEach(p => {
      totals[p] = 0;
      counts[p] = 0;
    });

    filtered.forEach(r => {
      ploKeys.forEach(p => {
        const v = Number(r[p]);
        if (!isNaN(v)) {
          totals[p] += v;
          counts[p]++;
        }
      });
    });

    const plo = ploKeys.map(p => ({
      plo: p,
      average: counts[p] ? +(totals[p] / counts[p]).toFixed(1) : 0
    }));

    const benchmark = 70;
    const achieved = plo.filter(p => p.average >= benchmark).length;

    res.json({
      summary: {
        students: filtered.length,
        achieved,
        atRisk: plo.length - achieved
      },
      plo
    });

  } catch (err) {
    console.error("ADMIN PROGRAMME PLO ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


export default router;
