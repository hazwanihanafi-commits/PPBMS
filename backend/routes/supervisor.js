// backend/routes/supervisor.js
import express from "express";
import jwt from "jsonwebtoken";

import { readMasterTracking, readAssessmentPLO } from "../services/googleSheets.js";
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

/* ================= STUDENT DETAILS ================= */
router.get("/student/:email", auth, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    /* -------- MASTER TRACKING -------- */
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) {
      return res.status(404).json({ error: "Student not found" });
    }

    const timeline = buildTimelineForRow(raw);

    /* -------- ASSESSMENT_PLO -------- */
    const assessments = await readAssessmentPLO(process.env.SHEET_ID);

    // 🔥 THIS IS THE IMPORTANT FILTER
    const trxRows = assessments.filter(r =>
      (r["Student's Email"] || "").toLowerCase().trim() === email &&
      (r["Assessment_Type"] || "").trim() === "TRX500"
    );

    // 🔥 CQI DERIVATION
    const cqiByAssessment = deriveCQIByAssessment(trxRows);

    /* -------- RESPONSE -------- */
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
        cqiByAssessment // ✅ OBJECT WITH PLO STATUS
      }
    });

  } catch (e) {
    console.error("student detail error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
