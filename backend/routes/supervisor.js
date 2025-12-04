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

/* -------------------------------------------------------
   NORMALIZE STUDENT EMAIL FROM GOOGLE SHEETS
------------------------------------------------------- */
function getStudentEmail(r) {
  return (
    r["Student's Email"] ||
    r["Student Email"] ||
    r["Email"] ||
    r["email"] ||
    ""
  )
    .toLowerCase()
    .trim();
}

/* -------------------------------------------------------
   CALCULATE PROGRESS (%)
------------------------------------------------------- */
function calcProgress(timeline) {
  if (!timeline || timeline.length === 0) return 0;

  const total = timeline.length;
  const completed = timeline.filter((i) => i.actual).length;

  return Math.round((completed / total) * 100);
}

/* -------------------------------------------------------
   GET /api/supervisor/students
   Return all supervised students
------------------------------------------------------- */
router.get("/students", auth, async (req, res) => {
  try {
    const supervisorEmail = (req.user.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    // Filter rows where supervisor matches
    const supervisedRows = rows.filter(
      (r) =>
        (r["Main Supervisor's Email"] || "")
          .toLowerCase()
          .trim() === supervisorEmail
    );

    const students = supervisedRows.map((raw) => {
      const timeline = buildTimelineForRow(raw);
      const progressPercent = calcProgress(timeline);

      return {
        id:
          raw["Matric"] ||
          raw["Matric No"] ||
          raw["Student ID"] ||
          raw["StudentID"] ||
          "",

        name: raw["Student Name"] || "-",
        email: getStudentEmail(raw),
        start_date: raw["Start Date"] || "-",
        field: raw["Field"] || "-",
        programme: raw["Programme"] || "-",
        progressPercent,
        timeline,

        status:
          progressPercent === 100
            ? "Completed"
            : progressPercent === 0
            ? "Not Started"
            : "In Progress",

        raw
      };
    });

    return res.json({ students });
  } catch (err) {
    console.error("supervisor/students error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------
   GET /api/supervisor/student/:email
   Supervisor views ONE student's full progress
------------------------------------------------------- */
router.get("/student/:email", auth, async (req, res) => {
  try {
    const targetEmail = (req.params.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find((r) => getStudentEmail(r) === targetEmail);

    if (!raw) {
      return res.status(404).json({ error: "Student not found" });
    }

    const timeline = buildTimelineForRow(raw);
    const rowNumber = rows.indexOf(raw) + 2; // sheet row number

    return res.json({
      id:
        raw["Matric"] ||
        raw["Matric No"] ||
        raw["Student ID"] ||
        raw["StudentID"] ||
        "",

      name: raw["Student Name"],
      email: getStudentEmail(raw),
      programme: raw["Programme"],
      start_date: raw["Start Date"],
      field: raw["Field"],
      supervisor: raw["Main Supervisor"],
      rowNumber,
      timeline
    });
  } catch (err) {
    console.error("supervisor/student error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
