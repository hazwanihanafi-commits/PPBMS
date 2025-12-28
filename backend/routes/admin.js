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

/* ================= PROGRAMME SUMMARY ================= */
router.get("/programme-summary", adminAuth, async (req, res) => {
  const { programme } = req.query;
  if (!programme) {
    return res.status(400).json({ error: "Programme required" });
  }

  const rows = await readMasterTracking(process.env.SHEET_ID);

  let late = 0;
  let onTrack = 0;
  let graduated = 0;

  rows
    .filter(r => String(r.Programme || "").trim() === programme.trim())
    .forEach(r => {
      if (String(r.Status || "").trim() === "Graduated") {
        graduated++;
        return;
      }

      const timeline = buildTimelineForRow(r);

      if (timeline.some(t => t.status === "LATE")) late++;
      else onTrack++;
    });

  res.json({ late, onTrack, graduated });
});

/* =========================================================
   GET SINGLE STUDENT (ADMIN VIEW)
========================================================= */
router.get("/student/:email", adminAuth, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) {
      return res.status(404).json({ error: "Student not found" });
    }

    const profile = {
      student_id: raw["Matric"] || raw["Matric No"] || "",
      student_name: raw["Student Name"] || "",
      email: raw["Student's Email"] || "",
      programme: raw["Programme"] || "",
      field: raw["Field"] || "",
      department: raw["Department"] || "",
      supervisor: raw["Main Supervisor"] || "",
      cosupervisors: raw["Co-Supervisor(s)"] || "",
      status: raw["Status"] || "",
    };

    const timeline = buildTimelineForRow(raw);

    const DOCUMENT_KEYS = [
  "DPLC",
  "SUPERVISION_LOG",
  "APR_Y1",
  "APR_Y2",
  "APR_Y3",
  "ETHICS_APPROVAL",
  "PUBLICATION_ACCEPTANCE",
  "PROOF_OF_SUBMISSION",
  "CONFERENCE_PRESENTATION",
  "THESIS_NOTICE",
  "VIVA_REPORT",
  "CORRECTION_VERIFICATION",
  "FINAL_THESIS",
];

const documents = {};
DOCUMENT_KEYS.forEach(k => {
  documents[k] = raw[k] ? String(raw[k]).trim() : "";
});

    res.json({
      row: {
        ...profile,
        timeline,
        documents: {
          DPLC: raw.DPLC || "",
          SUPERVISION_LOG: raw.SUPERVISION_LOG || "",
          APR_Y1: raw.APR_Y1 || "",
          APR_Y2: raw.APR_Y2 || "",
          APR_Y3: raw.APR_Y3 || "",
          ETHICS_APPROVAL: raw.ETHICS_APPROVAL || "",
          PUBLICATION_ACCEPTANCE: raw.PUBLICATION_ACCEPTANCE || "",
          PROOF_OF_SUBMISSION: raw.PROOF_OF_SUBMISSION || "",
          CONFERENCE_PRESENTATION: raw.CONFERENCE_PRESENTATION || "",
          THESIS_NOTICE: raw.THESIS_NOTICE || "",
          VIVA_REPORT: raw.VIVA_REPORT || "",
          CORRECTION_VERIFICATION: raw.CORRECTION_VERIFICATION || "",
          FINAL_THESIS: raw.FINAL_THESIS || "",
        }
      }
    });
  } catch (err) {
    console.error("Admin get student error:", err);
    res.status(500).json({ error: "Failed to load student" });
  }
});

export default router;
