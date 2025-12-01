// backend/routes/supervisor.js
import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet } from "../utils/sheetCache.js";
import { buildTimeline } from "../utils/buildTimeline.js";

const router = express.Router();

// ---------------------------
// AUTH MIDDLEWARE
// ---------------------------
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

// ---------------------------
// SUPERVISOR — LIST STUDENTS
// ---------------------------
router.get("/students", auth, async (req, res) => {
  try {
    const supervisorEmail = (req.user.email || "").toLowerCase().trim();
    const rows = await getCachedSheet(process.env.SHEET_ID);

    // filter all students whose supervisor email matches login
    const supervised = rows.filter(
      (r) =>
        (r["Main Supervisor's Email"] || "")
          .toLowerCase()
          .trim() === supervisorEmail
    );

    let output = [];

    for (const row of supervised) {
      // build timeline for each student
      const timeline = buildTimeline(row);

      // progress %: completed activities / total activities
      const completedCount = timeline.filter(
        (t) => t.status === "Completed"
      ).length;

      const totalCount = timeline.length;

      const progressPercent =
        totalCount === 0
          ? 0
          : Math.round((completedCount / totalCount) * 100);

      output.push({
        student_name: row["Student Name"],
        email: row["Student's Email"],
        programme: row["Programme"],
        field: row["Field"] || "",
        start_date: row["Start Date"],

        progress_percent: progressPercent,
        completed: completedCount,
        total: totalCount,

        timeline, // <-- send full timeline to frontend
      });
    }

    return res.json({ students: output });
  } catch (err) {
    console.error("SUPERVISOR ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
