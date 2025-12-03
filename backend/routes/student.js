// backend/routes/student.js
import express from "express";
import jwt from "jsonwebtoken";

import { getCachedSheet } from "../utils/sheetCache.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { writeStudentActual } from "../services/googleSheets.js";

const router = express.Router();

/*-------------------------------------------------------
  JWT Auth Middleware
-------------------------------------------------------*/
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

/*-------------------------------------------------------
  GET /api/student/me
-------------------------------------------------------*/
router.get("/me", auth, async (req, res) => {
  try {
    const email = (req.user.email || "").toLowerCase().trim();
    const rows = await getCachedSheet(process.env.SHEET_ID);

    const raw = rows.find(
      (r) => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) return res.status(404).json({ error: "Student not found" });

    // Build student profile
    const profile = {
      student_id:
        raw["Matric"] ||
        raw["Matric No"] ||
        raw["Student ID"] ||
        raw["StudentID"] ||
        "",

      student_name: raw["Student Name"] || raw["StudentName"] || "",
      email: raw["Student's Email"] || "",
      programme: raw["Programme"] || "",
      supervisor:
        raw["Main Supervisor"] ||
        raw["Main Supervisor's Email"] ||
        raw["Supervisor"] ||
        "",

      start_date: raw["Start Date"] || "",

      field:
        raw["Field"] ||
        raw["Field of Study"] ||
        raw["Research Field"] ||
        raw["Research Area"] ||
        raw["Specialization"] ||
        "-",

      department:
        raw["Department"] ||
        raw["Department Name"] ||
        raw["Dept"] ||
        raw["Main Department"] ||
        raw["School / Department"] ||
        "-",

      // Send the raw Google Sheet row for submission folders
      raw,
    };

    const timeline = buildTimelineForRow(raw);

    return res.json({ row: { ...profile, timeline } });
  } catch (err) {
    console.error("student/me ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

/*-------------------------------------------------------
  POST /api/student/update-actual
  Manual override for actual date (for admin)
-------------------------------------------------------*/
router.post("/update-actual", auth, async (req, res) => {
  try {
    const { studentId, activity, date } = req.body;

    if (!studentId || !activity) {
      return res.status(400).json({ error: "Missing required data" });
    }

    const rows = await getCachedSheet(process.env.SHEET_ID);

    const rowIndex = rows.findIndex(
      (r) =>
        (r["Matric"] ||
          r["Matric No"] ||
          r["Student ID"] ||
          r["StudentID"] ||
          "") === studentId
    );

    if (rowIndex === -1) {
      return res.status(404).json({ error: "Student not found" });
    }

    const rowNumber = rowIndex + 2; // +2 because row 1 = header

    // Column header names
    const actualColumn = `${activity} - Actual`;

    // Write to sheet (using your global sheet writer)
    await writeStudentActual(
      process.env.SHEET_ID,
      rowNumber,
      actualColumn,
      null,        // no URL in manual update
      date,
      null
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("student/update-actual ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
