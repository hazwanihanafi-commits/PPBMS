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

router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

/* =========================================================
   GET /api/supervisor/students
   → Supervisor Dashboard List (FIXED)
========================================================= */
router.get("/students", auth, async (req, res) => {
  try {
    const supervisorEmail = req.user.email.toLowerCase().trim();

    // ✅ ONLY MASTER TRACKING
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const students = rows
      .filter(r => {
        const mainSupervisor = String(
          r["Main Supervisor's Email"] || ""
        )
          .toLowerCase()
          .trim();

        return mainSupervisor === supervisorEmail;
      })
      .map(r => {
        const timeline = buildTimelineForRow(r);

        const completed = timeline.filter(t => t.status === "Completed").length;
        const progress = timeline.length
          ? Math.round((completed / timeline.length) * 100)
          : 0;

        let status = "On Track";
        if (timeline.some(t => t.status === "Late")) status = "Late";
        else if (timeline.some(t => t.status === "Due Soon")) status = "Due Soon";

        return {
          name: r["Student Name"] || "-",
          email: (r["Student's Email"] || "").toLowerCase(),
          matric: r["Matric"] || "-",
          programme: r["Programme"] || "-",
          progress,
          status
        };
      });

    res.json({ students });

  } catch (e) {
    console.error("Supervisor dashboard error:", e);
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
  const DOC_MAP = {
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
  "Final Thesis": "FINAL_THESIS"
};

const documents = {};
Object.entries(DOC_MAP).forEach(([label, col]) => {
  documents[label] = raw[col] || "";
});

    /* ---------- ASSESSMENT PLO ---------- */
    const assessmentRows = await readASSESSMENT_PLO(process.env.SHEET_ID);
    const matric = String(raw["Matric"]).trim();

    const studentRows = assessmentRows.filter(
      r => String(r.matric || r.matricno || "").trim() === matric
    );

    const cqiByAssessment = {};
    const remarksByAssessment = {};

    studentRows.forEach(r => {
      const type = String(r.assessment_type || "").toUpperCase();
      if (!cqiByAssessment[type]) cqiByAssessment[type] = {};

      for (let i = 1; i <= 11; i++) {
        const v = r[`plo${i}`];
        if (typeof v === "number") {
          cqiByAssessment[type][`PLO${i}`] = {
            average: v,
            status: v >= 3 ? "Achieved" : "CQI Required"
          };
        }
      }

      if (r.remarks) remarksByAssessment[type] = r.remarks;
    });

    /* ---------- FINAL PLO ---------- */
    const finalPLO = aggregateFinalPLO(cqiByAssessment);

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

    await updateASSESSMENT_PLO_Remark({
      studentMatric,
      assessmentType,
      remark
    });

    await updateASSESSMENT_PLO_Cell({
      studentMatric,
      assessmentType,
      column: "SUPERVISOR_REMARK_DATE",
      value: new Date().toISOString().slice(0, 10)
    });

    res.json({ success: true });

  } catch (e) {
    console.error("Supervisor remark error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
