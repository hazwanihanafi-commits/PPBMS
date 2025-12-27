import express from "express";
import jwt from "jsonwebtoken";

import {
  readFINALPROGRAMPLO,
  readASSESSMENT_PLO,
  readMasterTracking,
} from "../services/googleSheets.js";

import { computeProgrammeCQI } from "../utils/computeProgrammeCQI.js";

const router = express.Router();

/* ================= AUTH ================= */
function adminAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* =========================================================
   PROGRAMME LIST
========================================================= */
router.get("/programmes", adminAuth, async (req, res) => {
  const rows = await readFINALPROGRAMPLO(process.env.SHEET_ID);
  const programmes = [
    ...new Set(rows.map(r => String(r.Programme || "").trim()).filter(Boolean)),
  ];
  res.json({ programmes });
});

/* =========================================================
   PROGRAMME CQI
========================================================= */
router.get("/programme-plo", adminAuth, async (req, res) => {
  const { programme } = req.query;
  if (!programme) return res.status(400).json({ error: "Programme required" });

  const data = await computeProgrammeCQI(programme, process.env.SHEET_ID);
  res.json(data);
});

/* =========================================================
   PROGRAMME GRADUATES (TAB 1)
========================================================= */
router.get("/programme-graduates", adminAuth, async (req, res) => {
  const { programme } = req.query;
  const rows = await readMasterTracking(process.env.SHEET_ID);

  const students = rows
    .filter(r =>
      String(r.Programme || "").trim() === programme.trim() &&
      String(r.Status || "").trim() === "Graduated"
    )
    .map(r => ({
      matric: r.Matric || "",
      name: r["Student Name"] || "",
      email: r["Student's Email"] || "",
    }));

  res.json({ count: students.length, students });
});

/* =========================================================
   PROGRAMME ACTIVE STUDENTS (TAB 2)
========================================================= */
router.get("/programme-active-students", adminAuth, async (req, res) => {
  const { programme } = req.query;
  const rows = await readMasterTracking(process.env.SHEET_ID);

  const students = rows
    .filter(r =>
      String(r.Programme || "").trim() === programme.trim() &&
      String(r.Status || "").trim() === "Active"
    )
    .map(r => ({
      matric: r.Matric || "",
      email: r["Student's Email"] || "",
      status: deriveStatus(
        r["Development Plan & Learning Contract - Expected"],
        r["Development Plan & Learning Contract - Actual"]
      ),
    }));

  res.json({ count: students.length, students });
});
/* =========================================================
   ADMIN STUDENT DETAIL
   (EXACT MIRROR OF SUPERVISOR – READ ONLY)
========================================================= */
router.get("/student/:email", adminAuth, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    const masterRows = await readMasterTracking(process.env.SHEET_ID);
    const raw = masterRows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) return res.status(404).json({ row: null });

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

    /* ---------- ASSESSMENT_PLO ---------- */
    const assessmentRows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    const matric = String(raw["Matric"] || "").trim();
    const studentRows = assessmentRows.filter(
      r => String(r.matric || r.matricno || "").trim() === matric
    );

    /* ---------- GROUP BY ASSESSMENT ---------- */
    const grouped = {};
    studentRows.forEach(r => {
      const type = String(r.assessment_type || "").toUpperCase();
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(r);
    });

    /* ---------- CQI + REMARKS ---------- */
    const cqiByAssessment = {};
    const remarksByAssessment = {};

    Object.entries(grouped).forEach(([assessment, rows]) => {
      const ploResult = {};

      for (let i = 1; i <= 11; i++) {
        const values = rows
          .map(r => r[`plo${i}`])
          .filter(v => typeof v === "number");

        if (!values.length) continue;

        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        ploResult[`PLO${i}`] = {
          average: Number(avg.toFixed(2)),
          status: avg >= 3 ? "Achieved" : "CQI Required"
        };
      }

      if (Object.keys(ploResult).length) {
        cqiByAssessment[assessment] = ploResult;
      }

      const remarkRow = rows.find(r => r.remarks && r.remarks.trim());
      if (remarkRow) remarksByAssessment[assessment] = remarkRow.remarks;
    });

    /* ---------- FINAL PLO ---------- */
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
    console.error("ADMIN student error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
