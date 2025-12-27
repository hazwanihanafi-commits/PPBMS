import express from "express";
import jwt from "jsonwebtoken";

import {
  readFINALPROGRAMPLO,
  readASSESSMENT_PLO,
  readMasterTracking,
} from "../services/googleSheets.js";

import { computeProgrammeCQI } from "../utils/computeProgrammeCQI.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { aggregateFinalPLO } from "../utils/finalPLOAggregate.js";

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

/* ================= DOCUMENT MAP ================= */
const DOC_COLUMN_MAP = {
  "Development Plan & Learning Contract": "DPLC",
  "Student Supervision Logbook": "SUPERVISION_LOG",
  "Annual Progress Review – Year 1": "APR_Y1",
  "Annual Progress Review – Year 2": "APR_Y2",
  "Annual Progress Review – Year 3": "APR_Y3",
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
   PROGRAMMES
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
   PROGRAMME GRADUATES
========================================================= */
router.get("/programme-graduates", adminAuth, async (req, res) => {
  const { programme } = req.query;
  if (!programme) return res.status(400).json({ error: "Programme required" });

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const students = rows
    .filter(r =>
      String(r.Programme || "").trim() === programme.trim() &&
      String(r.Status || "").trim() === "Graduated"
    )
    .map(r => ({
      matric: r.Matric || "",
      name: r["Student Name"] || "",
      email: (r["Student's Email"] || "").toLowerCase().trim(),
    }));

  res.json({ count: students.length, students });
});

/* =========================================================
   PROGRAMME ACTIVE STUDENTS
========================================================= */
router.get("/programme-active-students", adminAuth, async (req, res) => {
  const { programme } = req.query;
  if (!programme) return res.status(400).json({ error: "Programme required" });

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const students = rows
    .filter(r =>
      String(r.Programme || "").trim() === programme.trim() &&
      String(r.Status || "").trim() === "Active"
    )
    .map(r => ({
      matric: r.Matric || "",
      email: (r["Student's Email"] || "").toLowerCase().trim(),
      status: "Active",
    }));

  res.json({ count: students.length, students });
});

/* =========================================================
   ADMIN STUDENT DETAIL (SUPERVISOR MIRROR)
========================================================= */
router.get("/student/:email", adminAuth, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();
    const masterRows = await readMasterTracking(process.env.SHEET_ID);

    const raw = masterRows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) return res.status(404).json({ row: null });

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

    const timeline = buildTimelineForRow(raw);

    const documents = {};
    Object.entries(DOC_COLUMN_MAP).forEach(([label, col]) => {
      documents[label] = raw[col] || "";
    });

    /* ---------- CQI ---------- */
    const assessmentRows = await readASSESSMENT_PLO(process.env.SHEET_ID);
    const matric = String(raw["Matric"]).trim();

    const studentRows = assessmentRows.filter(
      r => String(r.matric || "").trim() === matric
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
      const ploData = {};

      for (let i = 1; i <= 11; i++) {
        const vals = rows.map(r => r[`plo${i}`]).filter(v => typeof v === "number");
        if (!vals.length) continue;

        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        ploData[`PLO${i}`] = {
          average: Number(avg.toFixed(2)),
          status: avg >= 3 ? "Achieved" : "CQI Required",
        };
      }

      if (Object.keys(ploData).length) cqiByAssessment[type] = ploData;

      const remark = rows.find(r => r.remarks && r.remarks.trim());
      if (remark) remarksByAssessment[type] = remark.remarks;
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
        documents,
        cqiByAssessment,
        finalPLO,
        remarksByAssessment,
      }
    });

  } catch (e) {
    console.error("ADMIN student error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
