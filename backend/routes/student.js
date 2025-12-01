import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet } from "../utils/sheetCache.js";
import { buildTimeline } from "../utils/buildTimeline.js";

const router = express.Router();

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

    if (!raw) return res.status(404).json({ error: "Student not found" });

    const timeline = buildTimeline(raw);

    return res.json({
      student: {
        name: raw["Student Name"],
        email: raw["Student's Email"],
        programme: raw["Programme"],
        field: raw["Field"],
        department: raw["Department"],
        supervisor: raw["Main Supervisor"],
        start_date: raw["Start Date"],
      },
      timeline,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
