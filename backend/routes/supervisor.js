import express from "express";
import jwt from "jsonwebtoken";

import { readMasterTracking } from "../services/googleSheets.js";
import { readAssessmentPLO } from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import {
  deriveCQIByAssessment,
} from "../utils/cqiAggregate.js";

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
    const email = (req.user.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const students = rows
      .filter(
        r =>
          (r["Main Supervisor's Email"] || "")
            .toLowerCase()
            .trim() === email
      )
      .map(r => ({
        id: r["Matric"] || "",
        name: r["Student Name"] || "",
        email: (r["Student's Email"] || "").toLowerCase(),
        programme: r["Programme"] || ""
      }));

    res.json({ students });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ================= STUDENT DETAILS ================= */
router.get("/student/:email", auth, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) {
      return res.status(404).json({ error: "Student not found" });
    }

    const timeline = buildTimelineForRow(raw);

    const assessments = await readAssessmentPLO(process.env.SHEET_ID);
    const studentAssessments = assessments.filter(
      a => a.Student_Email === email
    );

    res.json({
      row: {
        student_id: raw["Matric"] || "",
        student_name: raw["Student Name"] || "",
        email,
        programme: raw["Programme"] || "",
        timeline,
        documents: {},

        // 🔒 SAFE DEFAULTS (VERY IMPORTANT)
        cqiByAssessment: deriveCQIByAssessment(studentAssessments) || {},
        ploRadar: deriveCumulativePLO(studentAssessments) || {}
      }
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
