import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking, writeSheetCell } from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { resetSheetCache } from "../utils/sheetCache.js";
import { columnNumberToLetter } from "../utils/columnUtils.js";

const router = express.Router();
const SHEET = "MasterTracking";

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

    if (!raw) return res.status(404).json({ error: "Student not found" });

    const profile = {
      student_id: raw["Matric"] || raw["Matric No"] || raw["Student ID"] || "",
      student_name: raw["Student Name"] || "",
      email: raw["Student's Email"] || "",
      programme: raw["Programme"] || "",
      start_date: raw["Start Date"] || "",
      field: raw["Field"] || "",
      department: raw["Department"] || "",
      supervisor: raw["Main Supervisor"] || "",
      cosupervisors: raw["Co-Supervisor(s)"] || "",
      status: raw["Status"] || "",
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

    res.json({
      row: {
        ...profile,
        documents,
        timeline,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/* ================= UPDATE ACTUAL DATE ================= */
router.post("/update-actual", auth, async (req, res) => {
  try {
    const { activity, date } = req.body;
    if (!activity || !date)
      return res.status(400).json({ error: "Missing data" });

    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const headers = Object.keys(rows[0]);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );
    if (idx === -1)
      return res.status(404).json({ error: "Student not found" });

    const colIndex = headers.indexOf(`${activity} - Actual`);
    if (colIndex === -1)
      return res.status(400).json({ error: "Column not found" });

    const col = columnNumberToLetter(colIndex + 1);

    await writeSheetCell(
      process.env.SHEET_ID,
      `${SHEET}!${col}${idx + 2}`,
      date
    );

    resetSheetCache();
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/* ================= SAVE DOCUMENT ================= */
router.post("/save-document", auth, async (req, res) => {
  try {
    const { document_key, file_url } = req.body;
    if (!document_key)
      return res.status(400).json({ error: "Missing document_key" });

    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const headers = Object.keys(rows[0]);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );
    if (idx === -1)
      return res.status(404).json({ error: "Student not found" });

    const colIndex = headers.indexOf(document_key);
    if (colIndex === -1)
      return res.status(400).json({ error: "Column not found" });

    const col = columnNumberToLetter(colIndex + 1);

    await writeSheetCell(
      process.env.SHEET_ID,
      `${SHEET}!${col}${idx + 2}`,
      file_url || ""
    );

    resetSheetCache();
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
