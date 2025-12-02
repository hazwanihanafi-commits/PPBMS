// backend/routes/supervisor.js
import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet } from "../utils/sheetCache.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";

const router = express.Router();

/*-------------------------------------------------------
  AUTH MIDDLEWARE
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
  GET STUDENTS FOR SUPERVISOR
-------------------------------------------------------*/
router.get("/students", auth, async (req, res) => {
  try {
    const supEmail = (req.query.email || "").toLowerCase().trim();
    if (!supEmail) return res.json({ students: [] });

    const rows = await getCachedSheet(process.env.SHEET_ID);

    // Only using your REAL column name:
    const column = "Main Supervisor's Email";

    const students = rows
      .filter(r => {
        const val = (r[column] || "").toLowerCase().trim();
        return val === supEmail;  // exact match
      })
      .map(r => {
        const raw = r;
        const timeline = buildTimelineForRow(raw);

        const progress = Math.round(
          (timeline.filter(t => t.status === "Completed").length /
            timeline.length) * 100
        );

        return {
          email: r["Student's Email"] || "",
          name: r["Student Name"] || "",
          programme: r["Programme"] || "",
          progress
        };
      });

    return res.json({ students });

  } catch (err) {
    console.error("SUPERVISOR ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
