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
   NORMALIZE EMAIL FROM SHEET
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
   CALCULATE PROGRESS %
------------------------------------------------------- */
function calcProgress(timeline) {
  if (!timeline || timeline.length === 0) return 0;
  const total = timeline.length;
  const completed = timeline.filter((i) => i.actual).length;
  return Math.round((completed / total) * 100);
}

/* -------------------------------------------------------
   GET ALL STUDENTS UNDER SUPERVISOR
   GET /api/supervisor/students
------------------------------------------------------- */
router.get("/students", auth, async (req, res) => {
  try {
    const spvEmail = (req.user.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const supervised = rows.filter(
      (r) =>
        (r["Main Supervisor's Email"] || "")
          .toLowerCase()
          .trim() === spvEmail
    );

    const students = supervised.map((raw) => {
      const timeline = buildTimelineForRow(raw);
      const progress = calcProgress(timeline);

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

        progressPercent: progress,
        timeline,

        status:
          progress === 100
            ? "Completed"
            : progress === 0
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
   GET ONE STUDENT FULL PROFILE
   GET /api/supervisor/student/:email
------------------------------------------------------- */
router.get("/student/:email", auth, async (req, res) => {
  try {
    const emailParam = (req.params.email || "").toLowerCase().trim();

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find(
      (r) => getStudentEmail(r) === emailParam
    );

    if (!raw) return res.status(404).json({ error: "Student not found" });

    const timeline = buildTimelineForRow(raw);
    const rowNumber = rows.indexOf(raw) + 2;

    return res.json({
      matric:
        raw["Matric"] ||
        raw["Matric No"] ||
        raw["Student ID"] ||
        raw["StudentID"] ||
        "",

      name: raw["Student Name"] || "-",
      email: getStudentEmail(raw),
      programme: raw["Programme"] || "-",
      field: raw["Field"] || "-",
      department: raw["Department"] || "-",
      start_date: raw["Start Date"] || "-",

      supervisor: raw["Main Supervisor"] || "-",
      cosupervisor: raw["Co-Supervisor(s)"] || "-",
      supervisorEmail: raw["Main Supervisor's Email"] || "-",

      progress: calcProgress(timeline),

      rowNumber,
      timeline
    });
  } catch (err) {
    console.error("supervisor/student error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
