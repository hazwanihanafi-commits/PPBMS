// backend/routes/supervisor.js
import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet } from "../utils/sheetCache.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";

const router = express.Router();

// ---------------- AUTH ----------------
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

// -------- Supervisor Email Lookup --------
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

// ---------------- ROUTE -----------------
router.get("/students", auth, async (req, res) => {
  try {
    const supervisorEmail = (req.user.email || "").toLowerCase().trim();
    const rows = await getCachedSheet(process.env.SHEET_ID);

    // Filter students under this supervisor
    const assigned = rows.filter(
      (r) => getSupervisorEmail(r) === supervisorEmail
    );

    const result = [];

    for (const r of assigned) {
      const timeline = buildTimelineForRow(r);

      const completed = timeline.filter((t) => t.status === "Completed").length;
      const total = timeline.length;
      const progress_percent = Math.round((completed / total) * 100);

      result.push({
        student_name: r["Student Name"] || "Unnamed",
        email: r["Student's Email"] || "",
        programme: r["Programme"] || "",
        field: r["Field"] || "",
        start_date: r["Start Date"] || "",
        progress_percent,
        completed,
        total,
        timeline,
      });
    }

    return res.json({ students: result });
  } catch (err) {
    console.error("supervisor/students", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
