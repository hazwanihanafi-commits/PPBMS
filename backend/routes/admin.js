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

function adminAuth(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  });
}

/* ================= HELPERS ================= */
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

/* ================= PROGRAMME SUMMARY ================= */
router.get("/programme-summary", adminAuth, async (req, res) => {
  const { programme } = req.query;
  const rows = await readMasterTracking(process.env.SHEET_ID);

  let late = 0, onTrack = 0, graduated = 0;

  rows
    .filter(r => String(r.Programme || "").trim() === programme.trim())
    .forEach(r => {
      if (String(r.Status || "").trim() === "Graduated") {
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

/* ================= SUPERVISOR → STUDENT ================= */
router.get("/student/:email", auth, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) return res.status(404).json({ error: "Student not found" });

    const timeline = buildTimelineForRow(raw);

    res.json({
      student: {
        matric: raw.Matric || "",
        name: raw["Student Name"] || "",
        email,
        programme: raw.Programme || "",
        status: raw.Status || "",
        timeline
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load student" });
  }
});

export default router;
