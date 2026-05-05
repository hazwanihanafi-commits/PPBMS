import express from "express";
import jwt from "jsonwebtoken";

import {
  readMasterTracking,
  readFINALPROGRAMPLO
} from "../services/googleSheets.js";

import {
  buildTimelineForRow
} from "../utils/buildTimeline.js";

import {
  normalizeStatus,
  normalizeProgramme,
  normMatric,
  normEmail
} from "../utils/normalizers.js";

const router = express.Router();

/* ==========================================
   AUTH
========================================== */
function adminAuth(req, res, next) {

  const token = (req.headers.authorization || "")
    .replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const user = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.user = user;
    next();

  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ==========================================
   DERIVE TIMELINE STATUS
========================================== */
function deriveOverallStatus(timeline) {

  if (!Array.isArray(timeline) || timeline.length === 0) {
    return "NO_DATA";
  }

  const statuses = timeline.map(t =>
    String(t.status || "").toUpperCase().trim()
  );

  if (statuses.some(s => s === "AT_RISK")) return "AT_RISK";
  if (statuses.some(s => s === "SLIGHTLY_DELAYED")) return "SLIGHTLY_DELAYED";
  if (statuses.every(s => s === "COMPLETED")) return "GRADUATED";

  return "ON_TRACK";
}

/* ==========================================
   PROGRAMME LIST (MASTER SOURCE)
========================================== */
router.get("/programmes", adminAuth, async (req, res) => {

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const programmes = [
    ...new Set(
      rows
        .map(r => normalizeProgramme(r.Programme))
        .filter(Boolean)
    )
  ];

  res.json({ programmes });
});

/* ==========================================
   PROGRAMME SUMMARY
========================================== */
router.get("/programme-summary", adminAuth, async (req, res) => {

  const { programme } = req.query;

  const rows = await readMasterTracking(process.env.SHEET_ID);

  let onTrack = 0;
  let slightlyDelayed = 0;
  let atRisk = 0;
  let graduated = 0;

  rows.forEach(r => {

    const prog = normalizeProgramme(r.Programme);
    const status = normalizeStatus(r.Status);

    if (prog !== normalizeProgramme(programme)) return;

    if (status === "GRADUATED") {
      graduated++;
      return;
    }

    // EXCLUDE TERMINATED & SUSPENDED
    if (status === "TERMINATED" || status === "SUSPENDED") {
      return;
    }

    if (status !== "ACTIVE") return;

    const timeline = buildTimelineForRow(r);
    const overall = deriveOverallStatus(timeline);

    if (overall === "AT_RISK") atRisk++;
    else if (overall === "SLIGHTLY_DELAYED") slightlyDelayed++;
    else onTrack++;

  });

  res.json({
    onTrack,
    slightlyDelayed,
    atRisk,
    graduated
  });
});

/* ==========================================
   STUDENT LIST (FILTERABLE)
========================================== */
router.get("/programme-students", adminAuth, async (req, res) => {

  const { programme, statusFilter } = req.query;

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const students = rows
    .filter(r => {

      const prog = normalizeProgramme(r.Programme);
      const status = normalizeStatus(r.Status);

      if (prog !== normalizeProgramme(programme)) return false;

      if (statusFilter && status !== statusFilter) return false;

      return true;
    })
    .map(r => {

      const timeline = buildTimelineForRow(r);

      return {
        matric: r.Matric || "",
        name: r["Student Name"] || "",
        email: normEmail(r["Student's Email"]),
        status: normalizeStatus(r.Status),
        overallStatus: deriveOverallStatus(timeline)
      };
    });

  res.json({
    count: students.length,
    students
  });
});

/* ==========================================
   PROGRAMME PLO (FINALPROGRAMPLO FILTERED)
========================================== */
router.get("/programme-plo", adminAuth, async (req, res) => {

  const { programme } = req.query;

  const masterRows = await readMasterTracking(process.env.SHEET_ID);

  // Step 1: Graduated set
  const graduatedMatric = new Set();
  const graduatedEmail = new Set();

  masterRows.forEach(r => {

    if (
      normalizeProgramme(r.Programme) === normalizeProgramme(programme) &&
      normalizeStatus(r.Status) === "GRADUATED"
    ) {
      graduatedMatric.add(normMatric(r.Matric));
      graduatedEmail.add(normEmail(r["Student's Email"]));
    }
  });

  // Step 2: Read PLO sheet
  const ploRows = await readFINALPROGRAMPLO(process.env.SHEET_ID);

  // Step 3: Match
  const validRows = ploRows.filter(r => {

    const m = normMatric(r.Matric);
    const e = normEmail(r["Student's Email"]);

    return graduatedMatric.has(m) || graduatedEmail.has(e);
  });

  if (validRows.length === 0) {
    return res.json({
      count: 0,
      plos: {}
    });
  }

  // Step 4: Compute averages
  const totals = {};
  const counts = {};

  validRows.forEach(r => {

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
    count: validRows.length,
    plos
  });
});

/* ==========================================
   SINGLE STUDENT DETAIL
========================================== */
router.get("/student/:email", adminAuth, async (req, res) => {

  const email = normEmail(req.params.email);

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const raw = rows.find(r =>
    normEmail(r["Student's Email"]) === email
  );

  if (!raw) {
    return res.status(404).json({ error: "Student not found" });
  }

  const timeline = buildTimelineForRow(raw);

  res.json({
    matric: raw.Matric || "",
    name: raw["Student Name"] || "",
    email,
    programme: raw.Programme || "",
    status: normalizeStatus(raw.Status),
    overallStatus: deriveOverallStatus(timeline),
    timeline
  });
});

export default router;
