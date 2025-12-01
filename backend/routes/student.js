// backend/routes/student.js
import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet } from "../utils/sheetCache.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";

const router = express.Router();

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

router.get("/me", auth, async (req, res) => {
  try {
    const email = (req.user.email || "").toLowerCase().trim();
    const rows = await getCachedSheet(process.env.SHEET_ID);

    const raw = rows.find(r => ((r["Student's Email"] || "").toLowerCase().trim() === email));
    if (!raw) return res.status(404).json({ error: "not found" });

    const row = {
      student_name: raw["Student Name"] || raw["StudentName"] || "",
      email: raw["Student's Email"] || "",
      programme: raw["Programme"] || "",
      supervisor: raw["Main Supervisor"] || "",
      start_date: raw["Start Date"] || "",
      raw
    };

    // build timeline on server side
    const timeline = buildTimelineForRow(raw);

    return res.json({ row: { ...row, timeline } });
  } catch (err) {
    console.error("student/me", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
