// backend/routes/student.js
import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking, writeSheetCell } from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";

const router = express.Router();

/* =========================
   AUTH MIDDLEWARE
========================= */
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

/* =========================
   DOCUMENT → COLUMN MAP
========================= */
const DOC_COLUMN_MAP = {
  // Monitoring & Supervision
  "Development Plan & Learning Contract (DPLC)": "DPLC",
  "Student Supervision Logbook": "SUPERVISION_LOG",
  "Annual Progress Review – Year 1": "APR_Y1",
  "Annual Progress Review – Year 2": "APR_Y2",
  "Annual Progress Review – Year 3 (Final Year)": "APR_Y3",

  // Ethics & Publications
  "Ethics Approval": "ETHICS_APPROVAL",
  "Publication Acceptance": "PUBLICATION_ACCEPTANCE",
  "Proof of Submission": "PROOF_OF_SUBMISSION",
  "Conference Presentation": "CONFERENCE_PRESENTATION",

  // Thesis & Viva
  "Thesis Notice": "THESIS_NOTICE",
  "Viva Report": "VIVA_REPORT",
  "Correction Verification": "CORRECTION_VERIFICATION",
  "Final Thesis": "FINAL_THESIS",
};

/* ============================================================
   GET /api/student/me
   → READ EVERYTHING FROM MASTER TRACKING
============================================================ */
router.get("/me", auth, async (req, res) => {
  try {
    const email = (req.user.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) return res.status(404).json({ error: "Student not found" });

    /* ---------- PROFILE ---------- */
    const profile = {
      student_id:
        raw["Matric"] ||
        raw["Matric No"] ||
        raw["Student ID"] ||
        raw["StudentID"] ||
        "",
      student_name: raw["Student Name"] || "",
      email: raw["Student's Email"] || "",
      programme: raw["Programme"] || "",
      supervisor: raw["Main Supervisor"] || "",
      cosupervisors: raw["Co-Supervisor(s)"] || "",
      start_date: raw["Start Date"] || "",
      department: raw["Department"] || "-",
      field: raw["Field"] || "-",
      status: raw["Status"] || "-"
    };

    /* ---------- DOCUMENTS (FROM MASTER TRACKING) ---------- */
    const documents = {};
    Object.entries(DOC_COLUMN_MAP).forEach(([label, col]) => {
      documents[label] = raw[col] || "";
    });

    /* ---------- TIMELINE ---------- */
    const timeline = buildTimelineForRow(raw);

    return res.json({
      row: {
        ...profile,
        documents,
        timeline
      }
    });

  } catch (e) {
    console.error("student/me error:", e);
    return res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   POST /api/student/update-actual
============================================================ */
router.post("/update-actual", auth, async (req, res) => {
  try {
    const { activity, date } = req.body;
    if (!activity || !date)
      return res.status(400).json({ error: "Missing data" });

    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );

    if (idx === -1)
      return res.status(404).json({ error: "Student not found" });

    await writeSheetCell(
      process.env.SHEET_ID,
      `${activity} - Actual`,
      idx + 2,
      date
    );

    return res.json({ success: true });

  } catch (e) {
    console.error("update-actual error:", e);
    return res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   POST /api/student/save-document
   → WRITE DIRECTLY INTO MASTER TRACKING
============================================================ */
router.post("/save-document", auth, async (req, res) => {
  try {
    const { document_type, file_url } = req.body;

    if (!document_type || !file_url)
      return res.status(400).json({ error: "Missing data" });

    const column = DOC_COLUMN_MAP[document_type];
    if (!column)
      return res.status(400).json({ error: "Invalid document type" });

    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );

    if (idx === -1)
      return res.status(404).json({ error: "Student not found" });

    await writeSheetCell(
      process.env.SHEET_ID,
      column,
      idx + 2,
      file_url
    );

    return res.json({
      success: true,
      document_type,
      file_url
    });

  } catch (e) {
    console.error("save-document error:", e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
