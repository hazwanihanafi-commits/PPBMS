// backend/routes/supervisor.js
import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet } from "../utils/sheetCache.js";
import buildTimeline from "../utils/buildTimeline.js";   // ⬅️ IMPORTANT
const router = express.Router();

// auth middleware
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

router.get("/students", auth, async (req, res) => {
  try {
    const email = (req.user.email || "").toLowerCase().trim();

    const rows = await getCachedSheet(process.env.SHEET_ID);

    // Filter students under this supervisor
    const list = rows.filter(
      (r) =>
        (r["Main Supervisor's Email"] || "").toLowerCase().trim() === email
    );

    const output = [];

    for (const r of list) {
      const timeline = buildTimeline(r);       // ⬅️ Use new engine
      const completed = timeline.filter((t) => t.status === "Completed").length;
      const total = timeline.length;
      const percent = Math.round((completed / total) * 100);

      output.push({
        student_name: r["Student Name"],
        email: r["Student's Email"],
        programme: r["Programme"],
        field: r["Field"] || "",
        start_date: r["Start Date"],
        progress_percent: percent,
        completed,
        total,
        timeline,
      });
    }

    res.json({ students: output });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
