import express from "express";
import jwt from "jsonwebtoken";
import {
  readMasterTracking,
  writeSheetCell,
} from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { ACTUAL_COLUMN_MAP } from "../utils/timelineColumnMap.js";
import { TIMELINE_MAP } from "../utils/timelineMap.js";

function normalizeActivity(activity) {
  if (ACTUAL_COLUMN_MAP[activity]) return activity;

  const entry = Object.entries(TIMELINE_MAP).find(
    ([_, cols]) =>
      cols.expected.startsWith(activity) ||
      cols.actual.startsWith(activity)
  );

  return entry ? entry[0] : null;
}

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

/* ================= GET STUDENT ================= */
router.get("/me", auth, async (req, res) => {
  try {
    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );

    if (!raw) {
      return res.status(403).json({
        error: "Student record not found in Master Tracking. Please contact admin."
      });
    }

    const profile = {
      student_id: raw["Matric"] || "",
      student_name: raw["Student Name"] || "",
      email: raw["Student's Email"] || "",
      programme: raw["Programme"] || "",
      start_date: raw["Start Date"] || "",
      field: raw["Field"] || "",
      department: raw["Department"] || "",
      supervisor: raw["Main Supervisor"] || "",
      cosupervisors: raw["Co-Supervisor(s)"] || "",
    };

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
    DOCUMENT_KEYS.forEach(k => (documents[k] = raw[k] || ""));

    const timeline = buildTimelineForRow(raw);

    res.json({ row: { ...profile, documents, timeline } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/* ================= MARK COMPLETED ================= */
/* ================= MARK COMPLETED ================= */
router.post("/update-actual", auth, async (req, res) => {
  try {
    const { activity, date } = req.body;

    if (!activity || !date) {
      return res.status(400).json({ error: "Missing data" });
    }

    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );

    if (idx === -1) {
      return res.status(404).json({ error: "Student not found" });
    }

    const normalized = normalizeActivity(activity);

if (!normalized) {
  console.error("❌ Unknown activity:", activity);
  return res.status(400).json({ error: `Unknown activity: ${activity}` });
}

const column = ACTUAL_COLUMN_MAP[normalized];


    console.log("📝 Writing to column:", column);
    console.log("📍 Row:", idx + 2);
    console.log("📅 Date:", date);

    await writeSheetCell(
      process.env.SHEET_ID,
      "MasterTracking",
      column,
      idx + 2,
      date
    );

    res.json({ success: true });

  } catch (e) {
    console.error("update-actual:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ================= RESET COMPLETED ================= */
router.post("/reset-actual", auth, async (req, res) => {
  try {
    const { activity } = req.body;

    if (!activity) {
      return res.status(400).json({ error: "Missing activity" });
    }

    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );

    if (idx === -1) {
      return res.status(404).json({ error: "Student not found" });
    }

       // ✅ NORMALIZE ACTIVITY
    const normalized = normalizeActivity(activity);

    if (!normalized) {
      console.error("❌ Unknown activity:", activity);
      return res.status(400).json({
        error: `Unknown activity: ${activity}`
      });
    }

    const column = ACTUAL_COLUMN_MAP[normalized];

    console.log("♻️ Resetting column:", column);

    await writeSheetCell(
      process.env.SHEET_ID,
      "MasterTracking",
      column,
      idx + 2,
      null   // clear value
    );

    res.json({ success: true });

  } catch (e) {
    console.error("reset-actual:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ================= SAVE DOCUMENT ================= */
router.post("/save-document", auth, async (req, res) => {
  try {
    const { document_key, file_url } = req.body;
    if (!document_key) {
      return res.status(400).json({ error: "Missing document_key" });
    }

    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );
    if (idx === -1) {
      return res.status(404).json({ error: "Student not found" });
    }

    const headers = Object.keys(rows[0] || {});
    if (!headers.includes(document_key)) {
      return res.status(400).json({
        error: `Invalid document key: ${document_key}`
      });
    }

    await writeSheetCell(
      process.env.SHEET_ID,
      "MasterTracking",
      document_key,
      idx + 2,
      file_url || ""
    );

    res.json({ success: true });
  } catch (e) {
    console.error("save-document:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
