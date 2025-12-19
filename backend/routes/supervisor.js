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

/* ================= HELPERS ================= */
function getStudentEmail(r) {
  return (
    r["Student's Email"] ||
    r["Student Email"] ||
    r["Email"] ||
    ""
  ).toLowerCase().trim();
}

function calcProgress(timeline) {
  if (!timeline || timeline.length === 0) return 0;
  const completed = timeline.filter((i) => i.actual).length;
  return Math.round((completed / timeline.length) * 100);
}

/* ================= LIST STUDENTS ================= */
router.get("/students", auth, async (req, res) => {
  try {
    const spvEmail = (req.user.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const students = rows
      .filter(
        r =>
          (r["Main Supervisor's Email"] || "")
            .toLowerCase()
            .trim() === spvEmail
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= STUDENT DETAILS ================= */
router.get("/student/:email", auth, async (req, res) => {
  try {
    const targetEmail = req.params.email.toLowerCase().trim();

    /* ---- Master Tracking ---- */
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === targetEmail
    );

    if (!raw) {
      return res.status(404).json({ error: "Student not found" });
    }

    const timeline = buildTimelineForRow(raw);

    /* ---- Documents ---- */
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

    /* ---- CQI DATA ---- */
    const allAssessments = await readAssessmentPLO(process.env.SHEET_ID);
    const studentAssessments = allAssessments.filter(
      a => a.Student_Email === targetEmail
    );

    const cqiByAssessment = deriveCQIByAssessment(studentAssessments);
    const ploRadar = deriveCumulativePLO(studentAssessments);

    /* ---- RESPONSE ---- */
    res.json({
      row: {
        student_id: raw["Matric"] || "",
        student_name: raw["Student Name"] || "",
        email: raw["Student's Email"] || "",
        programme: raw["Programme"] || "",
        start_date: raw["Start Date"] || "",
        field: raw["Field"] || "",
        department: raw["Department"] || "",
        supervisor: raw["Main Supervisor"] || "",
        cosupervisor: raw["Co-Supervisor(s)"] || "",
        documents,
        timeline,

        // ✅ used by frontend
        cqiByAssessment,
        ploRadar
      }
    });

  } catch (err) {
    console.error("supervisor/student error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------
   UPDATE CQI REMARK (Supervisor)
------------------------------------------------------- */
router.post("/student/cqi-remark", auth, async (req, res) => {
  try {
    const { studentEmail, assessmentType, plo, remark } = req.body;

    if (!studentEmail || !assessmentType || !plo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Read ASSESSMENT_PLO sheet
    const rows = await readAssessmentPLO(process.env.SHEET_ID);

    const targetRow = rows.find(
      r =>
        r.Student_Email === studentEmail.toLowerCase().trim() &&
        r.Assessment_Type === assessmentType
    );

    if (!targetRow) {
      return res.status(404).json({ error: "Assessment record not found" });
    }

    // Append / update remark (simple text, auditable)
    const updatedRemark = `[${plo}] ${remark}`;

    await writeAssessmentRemark(
      process.env.SHEET_ID,
      targetRow.__rowNumber,
      updatedRemark
    );

    res.json({ success: true });

  } catch (err) {
    console.error("save CQI remark error:", err);
    res.status(500).json({ error: err.message });
  }
});


export default router;
