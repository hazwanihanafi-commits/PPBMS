// backend/routes/supervisor.js
import express from "express";
import jwt from "jsonwebtoken";

import { readMasterTracking } from "../services/googleSheets.js";
import { readAssessmentPLO } from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import {
  deriveCQIByAssessment,
  deriveCumulativePLO
} from "../utils/cqiAggregate.js";

const router = express.Router();

/* ---------------- AUTH ---------------- */
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

/* ---------------- HELPERS ---------------- */
function getStudentEmail(r) {
  return (r["Student's Email"] || "").toLowerCase().trim();
}

function calcProgress(timeline) {
  if (!timeline?.length) return 0;
  const completed = timeline.filter(t => t.actual).length;
  return Math.round((completed / timeline.length) * 100);
}

function generateCQINarrative(cqiMap) {
  if (!cqiMap) return [];
  return Object.entries(cqiMap).map(([plo, status]) => {
    if (status === "GREEN") return `${plo} has achieved the expected standard.`;
    if (status === "AMBER") return `${plo} shows marginal attainment and should be monitored.`;
    return `${plo} requires intervention due to insufficient attainment.`;
  });
}

/* =====================================================
   ✅ 1. SUPERVISOR STUDENT LIST (THIS FIXES 404)
===================================================== */
router.get("/students", auth, async (req, res) => {
  try {
    const supervisorEmail = (req.user.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const students = rows
      .filter(
        r =>
          (r["Main Supervisor's Email"] || "")
            .toLowerCase()
            .trim() === supervisorEmail
      )
      .map(raw => {
        const timeline = buildTimelineForRow(raw);
        return {
          id: raw["Matric"] || "",
          name: raw["Student Name"] || "-",
          email: getStudentEmail(raw),
          programme: raw["Programme"] || "-",
          progressPercent: calcProgress(timeline),
          timeline
        };
      });

    res.json({ students });

  } catch (err) {
    console.error("students error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   ✅ 2. SINGLE STUDENT DETAILS + CQI
===================================================== */
router.get("/student/:email", auth, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    const rows = await readMasterTracking(process.env.SHEET_ID);
    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) return res.status(404).json({ error: "Student not found" });

    const timeline = buildTimelineForRow(raw);

    const documents = {
      "Development Plan & Learning Contract (DPLC)": raw["DPLC"] || "",
      "Student Supervision Logbook": raw["SUPERVISION_LOG"] || "",
      "Annual Progress Review – Year 1": raw["APR_Y1"] || "",
      "Annual Progress Review – Year 2": raw["APR_Y2"] || "",
      "Annual Progress Review – Year 3 (Final Year)": raw["APR_Y3"] || "",
      "ETHICS_APPROVAL": raw["ETHICS_APPROVAL"] || "",
      "PUBLICATION_ACCEPTANCE": raw["PUBLICATION_ACCEPTANCE"] || "",
      "PROOF_OF_SUBMISSION": raw["PROOF_OF_SUBMISSION"] || "",
      "CONFERENCE_PRESENTATION": raw["CONFERENCE_PRESENTATION"] || "",
      "THESIS_NOTICE": raw["THESIS_NOTICE"] || "",
      "VIVA_REPORT": raw["VIVA_REPORT"] || "",
      "CORRECTION_VERIFICATION": raw["CORRECTION_VERIFICATION"] || "",
      "FINAL_THESIS": raw["FINAL_THESIS"] || ""
    };

    const assessments = await readAssessmentPLO(process.env.SHEET_ID);
    const studentAssessments = assessments.filter(
      a => a.Student_Email === email
    );

    const cqiByAssessment = deriveCQIByAssessment(studentAssessments);
    const ploRadar = deriveCumulativePLO(studentAssessments);
    const cqiNarrative = generateCQINarrative(cqiByAssessment);

    res.json({
      row: {
        student_id: raw["Matric"] || "",
        student_name: raw["Student Name"] || "",
        email,
        programme: raw["Programme"] || "",
        start_date: raw["Start Date"] || "",
        field: raw["Field"] || "",
        department: raw["Department"] || "",
        supervisor: raw["Main Supervisor"] || "",
        cosupervisor: raw["Co-Supervisor(s)"] || "",
        documents,
        timeline,
        cqiByAssessment,
        ploRadar,
        cqiNarrative
      }
    });

  } catch (err) {
    console.error("student error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
