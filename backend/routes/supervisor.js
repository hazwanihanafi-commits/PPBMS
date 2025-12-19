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

    // 🔹 MasterTracking
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) {
      return res.status(404).json({ error: "Student not found" });
    }

    const timeline = buildTimelineForRow(raw);

    // 🔹 Assessment PLO (THIS WAS WRONG BEFORE)
    const assessments = await readAssessmentPLO(process.env.SHEET_ID);

    const trxAssessments = assessments.filter(
      a =>
        a.Student_Email === email &&   // ✅ CORRECT FIELD
        a.Assessment_Type === "TRX500"
    );

    console.log("TRX500 rows:", trxAssessments); // YOU SAW THIS ✔

    const cqiByAssessment = deriveCQIByAssessment(trxAssessments);

    res.json({
      row: {
        student_id: raw["Matric"] || "",
        student_name: raw["Student Name"] || "",
        email,
        programme: raw["Programme"] || "",
        timeline,
        documents: {},
        cqiByAssessment
      }
    });

  } catch (e) {
    console.error("student detail error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
