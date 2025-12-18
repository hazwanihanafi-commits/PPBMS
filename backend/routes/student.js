// backend/routes/student.js
import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking, writeSheetCell } from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";

const router = express.Router();

// AUTH MIDDLEWARE
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
  try {
    const email = (req.user.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) return res.status(404).json({ error: "Student not found" });

    // 1️⃣ Student profile
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
      start_date: raw["Start Date"] || "",
      department: raw["Department"] || "-",
      field: raw["Field"] || "-"
    };

    // 2️⃣ Documents (FROM MASTER TRACKING — CORRECT)
    const documents = {
      "Development Plan & Learning Contract (DPLC)": raw["DPLC"] || "",
      "Student Supervision Logbook": raw["SUPERVISION_LOG"] || "",
      "Annual Progress Review – Year 1": raw["APR_Y1"] || "",
      "Annual Progress Review – Year 2": raw["APR_Y2"] || "",
      "Annual Progress Review – Year 3 (Final Year)": raw["APR_Y3"] || ""
    };

    // 3️⃣ Timeline (NOW BUILT BEFORE RETURN)
    const timeline = buildTimelineForRow(raw);

    // 4️⃣ SINGLE RETURN (FIXED)
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

    const email = (req.user.email || "").toLowerCase().trim();

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (idx === -1)
      return res.status(404).json({ error: "Student not found" });

    const rowNumber = idx + 2;
    const actualCol = `${activity} - Actual`;

    await writeSheetCell(process.env.SHEET_ID, actualCol, rowNumber, date);

    return res.json({ success: true });

  } catch (e) {
    console.error("update-actual error:", e);
    return res.status(500).json({ error: e.message });
  }
});

/* ============================================================
    POST /api/student/save-document
    (writes directly into MasterTracking FileURL columns)
   ============================================================ */
router.post("/save-document", auth, async (req, res) => {
  try {
    const { key, url } = req.body;

    if (!key || !url)
      return res.status(400).json({ error: "Missing key or url" });

    const email = (req.user.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (idx === -1)
      return res.status(404).json({ error: "Student not found" });

    const rowNumber = idx + 2;

    // 🔑 MAP UI KEY → EXACT COLUMN NAME
    const COLUMN_MAP = {
      dplc: "Development Plan & Learning Contract - FileURL",
      apr1: "Annual Progress Review (Year 1) - FileURL",
      apr2: "Annual Progress Review (Year 2) - FileURL",
      fpr3: "Final Progress Review (Year 3) - FileURL",
    };

    const columnName = COLUMN_MAP[key];
    if (!columnName)
      return res.status(400).json({ error: "Invalid document key" });

    await writeSheetCell(
      process.env.SHEET_ID,
      columnName,
      rowNumber,
      url
    );

    return res.json({ success: true });

  } catch (e) {
    console.error("save-document error:", e);
    return res.status(500).json({ error: e.message });
  }
});


export default router;
