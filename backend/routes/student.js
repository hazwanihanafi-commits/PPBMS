// backend/routes/student.js
import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet } from "../utils/sheetCache.js";
import { buildTimeline } from "../utils/timeline.js";

const router = express.Router();

// --- authentication ---
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

router.get("/me", auth, async (req, res) => {
  try {
    const email = (req.user.email || "").toLowerCase().trim();
    const rows = await getCachedSheet(process.env.SHEET_ID);

    const raw = rows.find(
      (r) => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) return res.status(404).json({ error: "Not found" });

    // BUILD TIMELINE (this was missing before)
    const timeline = buildTimeline(raw, raw["Programme"]);

    return res.json({
      row: {
        student_name: raw["Student Name"],
        email: raw["Student's Email"],
        programme: raw["Programme"],
        supervisor: raw["Main Supervisor"],
        field: raw["Field"],
        start_date: raw["Start Date"],
        timeline,
        raw,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
