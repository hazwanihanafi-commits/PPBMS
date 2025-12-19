import express from "express";
import jwt from "jsonwebtoken";

import { readMasterTracking, readASSESSMENT_PLO } from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { deriveCQIByAssessment } from "../utils/cqiAggregate.js";

const router = express.Router();

/* ================= AUTH ================= */
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

/* ================= STUDENT LIST ================= */
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

    console.log("STUDENTS FOUND:", students.length);
    res.json({ students });

  } catch (e) {
    console.error("student list error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ================= STUDENT DETAILS ================= */
router.get("/student/:email", auth, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    /* ---- MASTER TRACKING ---- */
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) {
      return res.status(404).json({ error: "Student not found" });
    }

    const timeline = buildTimelineForRow(raw);

    /* ---- ASSESSMENT PLO ---- */
    const assessments = await readASSESSMENT_PLO(process.env.SHEET_ID);

    console.log("TOTAL ASSESSMENT ROWS:", assessments.length);

    const trxAssessments = assessments.filter(a =>
  (a["Student's Email"] || "").toLowerCase().trim() === email &&
  (a.Assessment_Type || "").toUpperCase().trim() === "TRX500"
);

    console.log("TRX500 MATCHED:", trxAssessments);

    const cqiByAssessment = deriveCQIByAssessment(trxAssessments);

    console.log("CQI RESULT:", cqiByAssessment);

    /* ---- RESPONSE ---- */
    res.json({
      row: {
        student_id: raw["Matric"] || "",
        student_name: raw["Student Name"] || "",
        email,
        programme: raw["Programme"] || "",
        field: raw["Field"] || "",
        department: raw["Department"] || "",
        timeline,
        documents: {},
        cqiByAssessment: cqiByAssessment || {}
      }
    });

  } catch (e) {
    console.error("student detail error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
