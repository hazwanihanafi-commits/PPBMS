import express from "express";
import jwt from "jsonwebtoken";

import { readMasterTracking, readFINALPROGRAMPLO } from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";

const router = express.Router();

/* ==========================================
   AUTH
========================================== */
function adminAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ==========================================
   🔥 SINGLE SOURCE LOGIC (SUPERVISOR SAME)
========================================== */
function normalizeStatus(raw) {
  const s = String(raw || "").toLowerCase().trim();

  if (s === "active") return "ACTIVE";
  if (s === "graduated") return "GRADUATED";
  if (s.includes("suspension")) return "SUSPENDED";
  if (s.includes("terminated")) return "TERMINATED";

  return "UNKNOWN";
}

function deriveOverallStatus(timeline) {

  if (!timeline || timeline.length === 0) return "NO_DATA";

  const statuses = timeline.map(t =>
    String(t.status || "").toUpperCase().trim()
  );

  // 🔴 SAME PRIORITY AS SUPERVISOR
  if (statuses.includes("AT_RISK")) return "AT_RISK";
  if (statuses.includes("SLIGHTLY_DELAYED")) return "SLIGHTLY_DELAYED";
  if (statuses.every(s => s === "COMPLETED")) return "GRADUATED";

  return "ON_TRACK";
}

function normalizeProgramme(p) {
  return String(p || "").toUpperCase().trim();
}

/* ==========================================
   PROGRAMMES
========================================== */
router.get("/programmes", adminAuth, async (req, res) => {

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const programmes = [
    ...new Set(
      rows.map(r => normalizeProgramme(r.Programme)).filter(Boolean)
    )
  ];

  res.json({ programmes });
});

/* ==========================================
   🔥 CORE ENGINE (USED BY BOTH ENDPOINTS)
========================================== */
function processStudents(rows, programme) {

  const result = [];

  rows.forEach(r => {

    const prog = normalizeProgramme(r.Programme);
    const status = normalizeStatus(r.Status);

    if (prog !== normalizeProgramme(programme)) return;

    // 🔥 EXACT SAME RULE AS SUPERVISOR
    if (status !== "ACTIVE" && status !== "GRADUATED") return;

    const timeline = buildTimelineForRow(r);
    const overall = deriveOverallStatus(timeline);

    result.push({
      matric: r.Matric || "",
      name: r["Student Name"] || "",
      email: (r["Student's Email"] || "").toLowerCase().trim(),
      status,
      overallStatus: overall
    });

  });

  return result;
}

/* ==========================================
   SUMMARY (USES SAME ENGINE)
========================================== */
router.get("/programme-summary", adminAuth, async (req, res) => {

  const { programme } = req.query;

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const students = processStudents(rows, programme);

  let onTrack = 0, delayed = 0, atRisk = 0, graduated = 0;

  students.forEach(s => {

    if (s.status === "GRADUATED") {
      graduated++;
      return;
    }

    if (s.overallStatus === "AT_RISK") atRisk++;
    else if (s.overallStatus === "SLIGHTLY_DELAYED") delayed++;
    else onTrack++;

  });

  res.json({
    onTrack,
    slightlyDelayed: delayed,
    atRisk,
    graduated
  });
});

/* ==========================================
   STUDENT LIST (USES SAME ENGINE)
========================================== */
router.get("/programme-students", adminAuth, async (req, res) => {

  const { programme } = req.query;

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const students = processStudents(rows, programme);

  res.json({
    count: students.length,
    students
  });
});

/* ==========================================
   PLO
========================================== */
router.get("/programme-plo", adminAuth, async (req, res) => {

  const { programme } = req.query;

  const master = await readMasterTracking(process.env.SHEET_ID);
  const ploRows = await readFINALPROGRAMPLO(process.env.SHEET_ID);

  const graduatedEmails = new Set(
    master
      .filter(r =>
        normalizeProgramme(r.Programme) === normalizeProgramme(programme) &&
        normalizeStatus(r.Status) === "GRADUATED"
      )
      .map(r =>
        String(r["Student's Email"] || "").toLowerCase().trim()
      )
  );

  const valid = ploRows.filter(r =>
    graduatedEmails.has(
      String(r["Student's Email"] || "").toLowerCase().trim()
    )
  );

  const totals = {}, counts = {};

  valid.forEach(r => {
    for (let i = 1; i <= 11; i++) {
      const key = `PLO${i}`;
      const val = parseFloat(r[key]);
      if (!isNaN(val)) {
        totals[key] = (totals[key] || 0) + val;
        counts[key] = (counts[key] || 0) + 1;
      }
    }
  });

  const plos = {};
  Object.keys(totals).forEach(k => {
    plos[k] = (totals[k] / counts[k]).toFixed(2);
  });

  res.json({
    count: valid.length,
    plos
  });
});

export default router;
