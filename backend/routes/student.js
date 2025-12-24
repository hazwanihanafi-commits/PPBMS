// backend/routes/student.js
import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking, writeSheetCell } from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { resetSheetCache } from "../utils/sheetCache.js";

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

/* ============================================================
   GET /api/student/me
============================================================ */
router.get("/me", auth, async (req, res) => {
  // 🔒 HARD ROLE GUARD
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "NOT_STUDENT" });
  }
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

    /* ---------- DOCUMENTS (KEY → VALUE) ---------- */
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
      "FINAL_THESIS"
    ];

    const documents = {};
    DOCUMENT_KEYS.forEach(key => {
      documents[key] = raw[key] || "";
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

    resetSheetCache();
    return res.json({ success: true });

  } catch (e) {
    console.error("update-actual error:", e);
    return res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   POST /api/student/save-document
   ✅ SAVE / UPDATE / REMOVE (KEY-BASED)
============================================================ */
router.post("/save-document", auth, async (req, res) => {
  try {
    const { document_key, file_url } = req.body;

    if (!document_key)
      return res.status(400).json({ error: "Missing document_key" });

    if (file_url === undefined)
      return res.status(400).json({ error: "Missing file_url" });

    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );

    if (idx === -1)
      return res.status(404).json({ error: "Student not found" });

    await writeSheetCell(
      process.env.SHEET_ID,
      document_key,
      idx + 2,
      file_url || ""
    );

    return res.json({ success: true });

  } catch (e) {
    console.error("save-document error:", e);
    return res.status(500).json({ error: e.message });
  }
});


export default router;
