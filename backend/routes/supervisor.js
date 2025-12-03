import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking } from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";

const router = express.Router();

// AUTH
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

// Get email from sheet row (safe)
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

// Calculate progress from timeline entries
function calcProgress(timeline) {
  const total = timeline.length;
  const completed = timeline.filter((i) => i.actual).length;
  return Math.round((completed / total) * 100);
}

/* -------------------------------------------------------
   GET /api/supervisor/students
------------------------------------------------------- */
router.get("/students", auth, async (req, res) => {
  try {
    const spvEmail = (req.user.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    // Filter students under this supervisor
    const supervisedRows = rows.filter(
      (r) =>
        (r["Main Supervisor's Email"] || "")
          .toLowerCase()
          .trim() === spvEmail
    );

    // Convert to frontend-friendly objects
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
          progressPercent === 100 ? "Completed" :
          progressPercent === 0 ? "Not Started" :
          "In Progress",

        raw
      };
    });

    return res.json({ students });

  } catch (err) {
    console.error("supervisor/students error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
