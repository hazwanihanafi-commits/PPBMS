// backend/routes/supervisor.js
import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking } from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";

const router = express.Router();

/* -------------------------------------------------------
   AUTH MIDDLEWARE
------------------------------------------------------- */
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

function getStudentEmail(r) {
  return (
    r["Student's Email"] ||
    r["Student Email"] ||
    r["Email"] ||
    ""
  )
    .toLowerCase()
    .trim();
}

function calcProgress(timeline) {
  if (!timeline || timeline.length === 0) return 0;
  const total = timeline.length;
  const completed = timeline.filter((i) => i.actual).length;
  return Math.round((completed / total) * 100);
}

/* -------------------------------------------------------
   GET ALL STUDENTS UNDER SUPERVISOR
   (Now includes status + severity ranking)
------------------------------------------------------- */
router.get("/students", auth, async (req, res) => {
  try {
    const spvEmail = (req.user.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const supervisedRows = rows.filter(
      (r) =>
        (r["Main Supervisor's Email"] || "").toLowerCase().trim() === spvEmail
    );

    const students = supervisedRows.map((raw) => {
      const timeline = buildTimelineForRow(raw);
      const progressPercent = calcProgress(timeline);

      /* -----------------------------------------
         RISK STATUS CALCULATION
      ----------------------------------------- */
      let status = "On Track";
      let severity = 2; // 0 = At Risk, 1 = Slightly Late, 2 = On Track

      const lateTasks = timeline.filter(
        (t) => !t.actual && t.remaining_days < 0
      );

      if (lateTasks.length > 0) {
        const worst = Math.min(...lateTasks.map((t) => t.remaining_days));

        if (worst < -30) {
          status = "At Risk";
          severity = 0;
        } else {
          status = "Slightly Late";
          severity = 1;
        }
      }

      /* -----------------------------------------
         RETURN STUDENT RECORD
      ----------------------------------------- */
      return {
        id:
          raw["Matric"] ||
          raw["Matric No"] ||
          raw["Student ID"] ||
          raw["StudentID"] ||
          "",
        name: raw["Student Name"] || "-",
        email: getStudentEmail(raw),
        programme: raw["Programme"] || "-",
        start_date: raw["Start Date"] || "-",
        field: raw["Field"] || "-",
        department: raw["Department"] || "-",
        progressPercent,
        status,    // ⭐ Added
        severity,  // ⭐ Added (for sorting)
        timeline,
      };
    });

    return res.json({ students });

  } catch (err) {
    console.error("supervisor/students error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------
   GET ONE STUDENT PROFILE + TIMELINE + DOCUMENTS
------------------------------------------------------- */
router.get("/student/:email", auth, async (req, res) => {
  try {
    const targetEmail = (req.params.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find((r) => getStudentEmail(r) === targetEmail);
    if (!raw) return res.status(404).json({ error: "Student not found" });

    const timeline = buildTimelineForRow(raw);
    const progress = calcProgress(timeline);
    const rowNumber = rows.indexOf(raw) + 2;

    // Document URLs
    const documents = {
      dplc: raw["Development Plan & Learning Contract - FileURL"] || "",
      apr1: raw["Annual Progress Review (Year 1) - FileURL"] || "",
      apr2: raw["Annual Progress Review (Year 2) - FileURL"] || "",
      fpr3: raw["Final Progress Review (Year 3) - FileURL"] || ""
    };

    return res.json({
      row: {
        student_id:
          raw["Matric"] ||
          raw["Matric No"] ||
          raw["Student ID"] ||
          raw["StudentID"] ||
          "",
        student_name: raw["Student Name"] || "-",
        email: getStudentEmail(raw),
        programme: raw["Programme"] || "-",
        start_date: raw["Start Date"] || "-",
        field: raw["Field"] || "-",
        department: raw["Department"] || "-",
        supervisor: raw["Main Supervisor"] || "-",
        cosupervisor: raw["Co-Supervisor(s)"] || "-",
        progress,
        rowNumber,
        documents,
        timeline,
      },
    });

  } catch (err) {
    console.error("supervisor/student error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
