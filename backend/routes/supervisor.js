// backend/routes/supervisor.js
import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet } from "../utils/sheetCache.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";

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

// helper to normalize supervisor email
function getSupervisorEmail(row) {
  return (
    row["Main Supervisor's Email"] ||
    row["Main Supervisor Email"] ||
    row["Supervisor Email"] ||
    row["Main Supervisor"] ||
    ""
  )
    .toString()
    .toLowerCase()
    .trim();
}

router.get("/students", auth, async (req, res) => {
  try {
    const email = (req.user.email || "").toLowerCase().trim();

    const rows = await getCachedSheet(process.env.SHEET_ID);

    // find all students under this supervisor
    const list = rows.filter((r) => getSupervisorEmail(r) === email);

    const output = [];

    for (const r of list) {
      const timeline = buildTimeline(r);

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
