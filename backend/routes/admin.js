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
router.get("/programme-graduates", adminAuth, async (req, res) => {
  const { programme } = req.query;
  const rows = await readMasterTracking(process.env.SHEET_ID);

  const students = rows.filter(r =>
    String(r.Programme || "").trim() === programme.trim() &&
    String(r.Status || "").trim() === "Graduated"
  );

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
router.get("/programme-active-students", adminAuth, async (req, res) => {
  const { programme } = req.query;
  const rows = await readMasterTracking(process.env.SHEET_ID);

  const students = rows
    .filter(r =>
      String(r.Programme || "").trim() === programme.trim() &&
      String(r.Status || "").trim() === "Active"
    )
    .map(r => {
      const timeline = buildTimelineForRow(r);
      return {
        matric: r.Matric || "",
        name: r["Student Name"] || "",
        email: (r["Student's Email"] || "").toLowerCase(),
        status: deriveOverallStatus(timeline)
      };
    });

  res.json({ count: students.length, students });
});

export default router;
