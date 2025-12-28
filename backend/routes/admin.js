import express from "express";
import jwt from "jsonwebtoken";
import {
  readMasterTracking,
  readFINALPROGRAMPLO
} from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { computeProgrammeCQI } from "../utils/computeProgrammeCQI.js";

const router = express.Router();

/* ================= AUTH ================= */
function adminAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ================= STATUS DERIVER ================= */
function deriveOverallStatus(timeline) {
  if (timeline.every(t => t.status === "COMPLETED")) return "COMPLETED";
  if (timeline.some(t => t.status === "LATE")) return "LATE";
  return "ON_TRACK";
}

/* ================= PROGRAMMES ================= */
router.get("/programmes", adminAuth, async (req, res) => {
  const rows = await readFINALPROGRAMPLO(process.env.SHEET_ID);
  const programmes = [
    ...new Set(rows.map(r => String(r.Programme || "").trim()).filter(Boolean))
  ];
  res.json({ programmes });
});

/* ================= PROGRAMME CQI ================= */
router.get("/programme-plo", adminAuth, async (req, res) => {
  const { programme } = req.query;
  if (!programme) return res.status(400).json({ error: "Programme required" });

  const data = await computeProgrammeCQI(programme, process.env.SHEET_ID);
  res.json(data);
});

/* ================= GRADUATED STUDENTS ================= */
router.get("/student/:email", adminauth, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();
    const masterRows = await readMasterTracking(process.env.SHEET_ID);

    const raw = masterRows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );
    if (!raw) return res.status(404).json({ error: "Student not found" });
    
  res.json({
    count: students.length,
    students: students.map(r => ({
      matric: r.Matric || "",
      name: r["Student Name"] || "",
      email: (r["Student's Email"] || "").toLowerCase()
    }))
  });
});

/* ================= ACTIVE STUDENT TRACKING ================= */

  router.get("/student/:email", adminauth, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();
    const masterRows = await readMasterTracking(process.env.SHEET_ID);

    const raw = masterRows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );
    if (!raw) return res.status(404).json({ error: "Student not found" });
    

    )
.map(r => {
  const timeline = buildTimelineForRow(r);
  const summary = summarizeTimelineStatus(timeline);

  let overallStatus = "On Track";
  if (summary.late > 0) overallStatus = "Late";
  if (summary.completed === timeline.length) overallStatus = "Completed";

  return {
    matric: r.Matric || "",
    name: r["Student Name"] || "",
    email: (r["Student's Email"] || "").trim(),
    status: overallStatus,
    summary
  };
});

  res.json({ count: students.length, students });
});
function summarizeTimelineStatus(timeline) {
  let late = 0;
  let completed = 0;
  let onTrack = 0;

  timeline.forEach(t => {
    if (t.status === "Completed") completed++;
    else if (t.status === "Late") late++;
    else onTrack++;
  });

  return { late, completed, onTrack };
}
router.get("/programme-summary", adminAuth, async (req, res) => {
  const { programme } = req.query;
  const rows = await readMasterTracking(process.env.SHEET_ID);

  let late = 0, onTrack = 0, graduated = 0;

  rows
    .filter(r => String(r.Programme || "").trim() === programme.trim())
    .forEach(r => {
      if (String(r.Status).trim() === "Graduated") {
        graduated++;
        return;
      }

      const timeline = buildTimelineForRow(r);
      const summary = summarizeTimelineStatus(timeline);

      if (summary.late > 0) late++;
      else onTrack++;
    });

  res.json({ late, onTrack, graduated });
});

export default router;




