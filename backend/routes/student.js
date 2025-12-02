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
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw)
      return res.status(404).json({ error: "Student not found" });

    // -------- Build Clean Student Profile --------
    const profile = {
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

      email: raw["Student's Email"] || "",
      programme: raw["Programme"] || "",
      supervisor: raw["Main Supervisor"] || raw["Supervisor"] || "",
      start_date: raw["Start Date"] || "",

      // 🔥 NEW: include field from various column names
      field:
        raw["Field"] ||
        raw["Field of Study"] ||
        raw["Research Field"] ||
        raw["Research Area"] ||
        raw["Specialization"] ||
        "-",

      // 🔥 NEW: include department from various column names
      department:
        raw["Department"] ||
        raw["Department Name"] ||
        raw["Dept"] ||
        raw["Main Department"] ||
        raw["School / Department"] ||
        "-",

      // 🔥 NEW: send raw row to frontend (needed for SubmissionFolder)
      raw
    };

    // ---------- Build timeline ----------
    const timeline = buildTimelineForRow(raw);

    return res.json({ row: { ...profile, timeline } });

  } catch (err) {
    console.error("student/me", err);
    return res.status(500).json({ error: err.message });
  }
});

    // -------- FIX: build timeline using full sheet row --------
    const timeline = buildTimelineForRow(raw);

    return res.json({ row: { ...profile, timeline } });
  } catch (err) {
    console.error("student/me", err);
    return res.status(500).json({ error: err.message });
  }
});

/*-------------------------------------------------------
  POST /api/student/update-actual
-------------------------------------------------------*/
router.post("/update-actual", auth, async (req, res) => {
  try {
    const { studentId, activity, date } = req.body;

    if (!studentId || !activity)
      return res.status(400).json({ error: "Missing data" });

    const rows = await getCachedSheet(process.env.SHEET_ID);

    const row = rows.find(r =>
      (r["Matric"] ||
       r["Matric No"] ||
       r["Student ID"] ||
       r["StudentID"] ||
       "") === studentId
    );

    if (!row)
      return res.status(404).json({ error: "Student not found" });

    const key = `${activity} - Actual`;
    row[key] = date;

    await row.save();

    return res.json({ success: true });
  } catch (err) {
    console.error("update-actual", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
