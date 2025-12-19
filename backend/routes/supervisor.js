import express from "express";
import jwt from "jsonwebtoken";

import { readMasterTracking } from "../services/googleSheets.js";
import { readAssessmentPLO } from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { deriveCQIByAssessment } from "../utils/cqiAggregate.js";

const router = express.Router();

/* =====================================================
   AUTH MIDDLEWARE
===================================================== */
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

/* =====================================================
   GET STUDENTS UNDER SUPERVISOR
===================================================== */
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

    res.json({ students });

  } catch (err) {
    console.error("students list error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   GET STUDENT DETAILS + TRX500 CQI
===================================================== */
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

    const timeline = buildTimelineForRow(raw);

    /* ---------- ASSESSMENT_PLO (NORMALISED) ---------- */
    const assessments = await readAssessmentPLO(process.env.SHEET_ID);

    // DEBUG – KEEP FOR NOW
    console.log("Requested student email:", email);
    console.log("Total assessment rows:", assessments.length);

    /* ---------- FILTER TRX500 ONLY ---------- */
    const trxAssessments = assessments.filter(a =>
      a.Student_Email === email &&
      (a.Assessment_Type || "").toUpperCase().trim() === "TRX500"
    );

    console.log("TRX500 rows matched:", trxAssessments);

    /* ---------- CQI ---------- */
    const cqiByAssessment =
      trxAssessments.length > 0
        ? deriveCQIByAssessment(trxAssessments)
        : {};

    /* ---------- RESPONSE ---------- */
    res.json({
      row: {
        student_id: raw["Matric"] || "",
        student_name: raw["Student Name"] || "",
        email,
        programme: raw["Programme"] || "",
        timeline,
        documents: {},

        // ✅ ALWAYS OBJECT (NEVER NULL / STRING)
        cqiByAssessment
      }
    });

  } catch (err) {
    console.error("student detail error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
