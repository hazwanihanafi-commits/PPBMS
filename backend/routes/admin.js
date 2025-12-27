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
   ADMIN STUDENT DETAIL (SUPERVISOR MIRROR)
========================================================= */
router.get("/student/:email", adminAuth, async (req, res) => {
  const key = decodeURIComponent(req.params.email).trim().toLowerCase();

  const assessmentRows = await readASSESSMENT_PLO(process.env.SHEET_ID);

  let studentRows = assessmentRows.filter(r => {
    const email = String(
      r["Student's Email"] ||
      r["Student Email"] ||
      r.studentemail ||
      ""
    ).trim().toLowerCase();

    const matric = String(r.matric || "").trim().toLowerCase();
    return email === key || matric === key;
  });

  let student = null;

  if (studentRows.length) {
    const base = studentRows[0];
    student = {
      email: base.studentemail || "",
      student_id: base.matric || "",
      student_name: base.studentname || "",
      programme: base.programme || "",
      status: base.status || "Active",
      timeline: [],
      documents: {},
      cqiByAssessment: {},
      remarksByAssessment: {},
      finalPLO: {},
    };
  }

  if (!student) {
    const master = await readMasterTracking(process.env.SHEET_ID);
    const m = master.find(r =>
      String(r["Student's Email"] || "").trim().toLowerCase() === key
    );

    if (!m) return res.status(404).json({ row: null });

    student = {
      email: m["Student's Email"],
      student_id: m.Matric,
      student_name: m["Student Name"],
      programme: m.Programme,
      status: m.Status,
      field: m.Field,
      department: m.Department,
      supervisor: m["Main Supervisor"],
      coSupervisors: m["Co-Supervisor"],
      timeline: buildTimelineFromMaster(m),
      documents: extractDocuments(m),
      cqiByAssessment: {},
      remarksByAssessment: {},
      finalPLO: {},
    };
  }

  const finalRows = await readFINALPROGRAMPLO(process.env.SHEET_ID);
  const f = finalRows.find(r => String(r.Matric || "") === student.student_id);
  if (f) {
    for (let i = 1; i <= 11; i++) {
      const v = Number(f[`PLO${i}`]);
      if (!isNaN(v)) student.finalPLO[`PLO${i}`] = v;
    }
  }

  res.json({ row: student });
});

/* ================= HELPERS ================= */

function deriveStatus(expected, actual) {
  if (actual) return "Completed";
  if (!expected) return "On Track";
  return new Date(expected) < new Date() ? "Late" : "On Track";
}

function buildTimelineFromMaster(m) {
  return [
    {
      activity: "Development Plan & Learning Contract",
      expected: m["Development Plan & Learning Contract - Expected"],
      actual: m["Development Plan & Learning Contract - Actual"],
      status: deriveStatus(
        m["Development Plan & Learning Contract - Expected"],
        m["Development Plan & Learning Contract - Actual"]
      ),
    },
    {
      activity: "Proposal Defense Endorsed",
      expected: m["Proposal Defense Endorsed - Expected"],
      actual: m["Proposal Defense Endorsed - Actual"],
      status: deriveStatus(
        m["Proposal Defense Endorsed - Expected"],
        m["Proposal Defense Endorsed - Actual"]
      ),
    },
  ];
}

function extractDocuments(m) {
  return {
    DPLC: m.DPLC,
    SUPERVISION_LOG: m.SUPERVISION_LOG,
    APR_Y1: m.APR_Y1,
    APR_Y2: m.APR_Y2,
    APR_Y3: m.APR_Y3,
    ETHICS_APPROVAL: m.ETHICS_APPROVAL,
    FINAL_THESIS: m.FINAL_THESIS,
  };
}

export default router;
