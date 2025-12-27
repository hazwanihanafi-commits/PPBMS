import express from "express";
import jwt from "jsonwebtoken";

import {
  readFINALPROGRAMPLO,
  readASSESSMENT_PLO,
  readMasterTracking
} from "../services/googleSheets.js";

import { computeProgrammeCQI } from "../utils/computeProgrammeCQI.js";

const router = express.Router();

/* ================= AUTH ================= */

function adminAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ================= PROGRAMME LIST ================= */
/**
 * SOURCE OF TRUTH: FINALPROGRAMPLO
 */
router.get("/programmes", adminAuth, async (req, res) => {
  try {
    const rows = await readFINALPROGRAMPLO(process.env.SHEET_ID);

    const programmes = [
      ...new Set(
        rows
          .map(r => String(r.Programme || "").trim())
          .filter(Boolean)
      )
    ];

    res.json({ programmes });
  } catch (err) {
    console.error("❌ Programme list error:", err);
    res.status(500).json({ error: "Failed to load programmes" });
  }
});

/* ================= PROGRAMME CQI ================= */

router.get("/programme-plo", adminAuth, async (req, res) => {
  try {
    const { programme } = req.query;
    if (!programme) {
      return res.status(400).json({ error: "Programme required" });
    }

    const data = await computeProgrammeCQI(
      programme,
      process.env.SHEET_ID
    );

    res.json(data);
  } catch (err) {
    console.error("❌ Programme CQI error:", err);
    res.status(500).json({
      error: "Failed to compute programme CQI",
      detail: err.message
    });
  }
});

/* ================= ADMIN STUDENT VIEW ================= */

router.get("/student/:email", adminAuth, async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.email)
      .trim()
      .toLowerCase();

    /* ===============================
       STEP 1: LOCATE STUDENT FROM ASSESSMENT_PLO
    =============================== */
    const assessmentRows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    const studentRows = assessmentRows.filter(r => {
      const email =
        String(r.studentemail || r["student_email"] || "")
          .trim()
          .toLowerCase();

      const matric =
        String(r.matric || "")
          .trim()
          .toLowerCase();

      return email === key || matric === key;
    });

    if (studentRows.length === 0) {
      return res.status(404).json({ row: null });
    }

    /* ===============================
       STEP 2: BASIC STUDENT PROFILE
    =============================== */
    const base = studentRows[0];

    const student = {
      email: base.studentemail || "",
      matric: base.matric || "",
      student_name: base.studentname || "",
      programme: base.programme || "",
      status: base.status || "Active",
      timeline: [],
      documents: {}
    };

    /* ===============================
       STEP 3: OPTIONAL ENRICHMENT FROM MASTERTRACKING
    =============================== */
    try {
      const master = await readMasterTracking(process.env.SHEET_ID);

      const match = master.find(m =>
        String(m["Matric"] || "").trim() === student.matric
      );

      if (match) {
        student.field = match["Field"] || "";
        student.department = match["Department"] || "";
        student.supervisor = match["Main Supervisor"] || "";
        student.cosupervisors = match["Co-Supervisor"] || "";
      }
    } catch {
      /* enrichment optional */
    }

    res.json({ row: student });

  } catch (err) {
    console.error("❌ ADMIN STUDENT VIEW ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= PROGRAMME STUDENTS ================= */
/**
 * SOURCE: MASTERTRACKING
 * PURPOSE: Admin dashboard student table
 */
router.get("/student/:email", adminAuth, async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.email)
      .trim()
      .toLowerCase();

    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    const studentRows = rows.filter(r => {
      const email =
        String(
          r["Student's Email"] ||
          r["Student Email"] ||
          r.studentemail ||
          r.student_email ||
          ""
        )
          .trim()
          .toLowerCase();

      const matric = String(r.matric || "").trim().toLowerCase();

      return email === key || matric === key;
    });

    if (studentRows.length === 0) {
      return res.status(404).json({ row: null });
    }

    const base = studentRows[0];

    const student = {
      email:
        base["Student's Email"] ||
        base["Student Email"] ||
        base.studentemail ||
        "",
      matric: base.matric || "",
      student_name: base.studentname || "",
      programme: base.programme || "",
      status: base.status || "Active",
      timeline: [],
      documents: {},
    };

    // OPTIONAL: enrich from MasterTracking
    try {
      const master = await readMasterTracking(process.env.SHEET_ID);
      const match = master.find(
        m => String(m.Matric || "").trim() === student.matric
      );

      if (match) {
        student.field = match.Field || "";
        student.department = match.Department || "";
        student.supervisor = match["Main Supervisor"] || "";
        student.coSupervisors = match["Co-Supervisor"] || "";
      }
    } catch {}

    res.json({ row: student });
  } catch (err) {
    console.error("ADMIN STUDENT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


export default router;
