// backend/routes/student.js
import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet } from "../utils/sheetCache.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";

const router = express.Router();

/*-------------------------------------------------------
  JWT AUTH
-------------------------------------------------------*/
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/*-------------------------------------------------------
  GET /api/student/me 
  Load student profile + timeline
-------------------------------------------------------*/
router.get("/me", auth, async (req, res) => {
  try {
    const email = (req.user.email || "").toLowerCase().trim();
    const rows = await getCachedSheet(process.env.SHEET_ID);

    // Match email column EXACTLY from your sheet
    const raw = rows.find(
      r =>
        ((r["Student's Email"] || "").toLowerCase().trim() === email)
    );

    if (!raw)
      return res.status(404).json({ error: "Student not found" });

    // ---------- Build clean, consistent student object ----------
    const row = {
      student_id:
        raw["Matric"] ||
        raw["Matric No"] ||
        raw["Student ID"] ||
        raw["StudentID"] ||
        "",

      student_name:
        raw["Student Name"] ||
        raw["StudentName"] ||
        "",

      email:
        raw["Student's Email"] ||
        "",

      programme:
        raw["Programme"] ||
        "",

      supervisor:
        raw["Main Supervisor"] ||
        raw["Supervisor"] ||
        "",

      start_date:
        raw["Start Date"] ||
        "",

      raw      // give all raw columns back to frontend
    };

    // ---------- Build timeline on backend ----------
    const timeline = buildTimelineForRow(raw);

    // ---------- Send merged result ----------
    return res.json({ row: { ...row, timeline } });

  } catch (err) {
    console.error("student/me", err);
    return res.status(500).json({ error: err.message });
  }
});

/*-------------------------------------------------------
  POST /api/student/update-actual
  Save actual date to Google Sheet
-------------------------------------------------------*/
router.post("/update-actual", auth, async (req, res) => {
  try {
    const { studentId, activity, date } = req.body;

    if (!studentId || !activity)
      return res.status(400).json({ error: "Missing data" });

    const rows = await getCachedSheet(process.env.SHEET_ID);

    // Find row by Matric / Student ID
    const row = rows.find(
      r =>
        (r["Matric"] ||
          r["Matric No"] ||
          r["Student ID"] ||
          r["StudentID"] ||
          "") === studentId
    );

    if (!row)
      return res.status(404).json({ error: "Student not found" });

    // Construct correct actual date column name
    const actualKey = `${activity} - Actual`;

    // Write date back to sheet
    row[actualKey] = date;
    await row.save();

    return res.json({ success: true });

  } catch (err) {
    console.error("update-actual", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
