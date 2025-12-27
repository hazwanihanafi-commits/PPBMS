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
  try {
    const rows = await readFINALPROGRAMPLO(process.env.SHEET_ID);

    const programmes = [
      ...new Set(
        rows.map(r => String(r.Programme || "").trim()).filter(Boolean)
      ),
    ];

    res.json({ programmes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   PROGRAMME CQI
========================================================= */
router.get("/programme-plo", adminAuth, async (req, res) => {
  const { programme } = req.query;
  if (!programme) return res.status(400).json({ error: "Programme required" });

  try {
    const data = await computeProgrammeCQI(programme, process.env.SHEET_ID);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   PROGRAMME GRADUATED STUDENTS (TAB 1)
   SOURCE: MASTERTRACKING
========================================================= */
router.get("/programme-graduates", adminAuth, async (req, res) => {
  const { programme } = req.query;
  if (!programme) return res.status(400).json({ error: "Programme required" });

  try {
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const students = rows
      .filter(
        r =>
          String(r.Programme || "").trim() === programme.trim() &&
          String(r.Status || "").trim() === "Graduated"
      )
      .map(r => ({
        matric: r.Matric || "",
        name: r["Student Name"] || "",
        email: r["Student's Email"] || "",
        programme: r.Programme || "",
      }));

    res.json({ count: students.length, students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   PROGRAMME ACTIVE STUDENTS (TAB 2)
========================================================= */
router.get("/programme-active-students", adminAuth, async (req, res) => {
  const { programme } = req.query;
  if (!programme) return res.status(400).json({ error: "Programme required" });

  try {
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const students = rows
      .filter(
        r =>
          String(r.Programme || "").trim() === programme.trim() &&
          String(r.Status || "").trim() === "Active"
      )
      .map(r => ({
        matric: r.Matric || "",
        email: r["Student's Email"] || "",
        status: "Active",
      }));

    res.json({ count: students.length, students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   ADMIN STUDENT DETAIL (FULL MIRROR OF SUPERVISOR)
========================================================= */
router.get("/student/:email", adminAuth, async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.email).trim().toLowerCase();

    /* ---------- ASSESSMENT DATA ---------- */
    const assessmentRows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    const studentRows = assessmentRows.filter(r => {
      const email = String(
        r["Student's Email"] ||
        r["Student Email"] ||
        r.studentemail ||
        r.student_email ||
        ""
      ).trim().toLowerCase();

      const matric = String(r.matric || "").trim().toLowerCase();
      return email === key || matric === key;
    });

    if (!studentRows.length) {
      return res.status(404).json({ row: null });
    }

    const base = studentRows[0];

    const student = {
      email:
        base["Student's Email"] ||
        base["Student Email"] ||
        base.studentemail ||
        "",
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

    /* ---------- CQI BY ASSESSMENT ---------- */
    const ploKeys = Array.from({ length: 11 }, (_, i) => `PLO${i + 1}`);

    studentRows.forEach(r => {
      const type = r.assessment_type;
      if (!type) return;

      if (!student.cqiByAssessment[type]) {
        student.cqiByAssessment[type] = {};
      }

      ploKeys.forEach(p => {
        const v = Number(r[p]);
        if (isNaN(v)) return;

        if (!student.cqiByAssessment[type][p]) {
          student.cqiByAssessment[type][p] = [];
        }
        student.cqiByAssessment[type][p].push(v);
      });

      if (r.Remarks) {
        student.remarksByAssessment[type] = r.Remarks;
      }
    });

    Object.entries(student.cqiByAssessment).forEach(([type, ploData]) => {
      Object.entries(ploData).forEach(([plo, values]) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        student.cqiByAssessment[type][plo] = {
          average: Number(avg.toFixed(2)),
          status: avg >= 3 ? "Achieved" : "CQI Required",
        };
      });
    });

    /* ---------- FINAL PLO ---------- */
    try {
      const finalRows = await readFINALPROGRAMPLO(process.env.SHEET_ID);
      const f = finalRows.find(
        r => String(r.Matric || "").trim() === student.student_id
      );

      if (f) {
        ploKeys.forEach(p => {
          const v = Number(f[p]);
          if (!isNaN(v)) student.finalPLO[p] = v;
        });
      }
    } catch {}

    /* ---------- MASTERTRACKING ENRICHMENT ---------- */
    try {
      const master = await readMasterTracking(process.env.SHEET_ID);
      const m = master.find(
        x => String(x.Matric || "").trim() === student.student_id
      );

      if (m) {
        student.field = m.Field || "";
        student.department = m.Department || "";
        student.supervisor = m["Main Supervisor"] || "";
        student.coSupervisors = m["Co-Supervisor"] || "";
        student.timeline = buildTimelineFromMaster(m);
        student.documents = extractDocuments(m);
      }
    } catch {}

    res.json({ row: student });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= HELPERS ================= */

function deriveStatus(expected, actual) {
  if (actual) return "Completed";
  if (!expected) return "On Time";
  return new Date(expected) < new Date() ? "Late" : "On Time";
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
