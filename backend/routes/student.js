import express from "express";
import jwt from "jsonwebtoken";
import {
  readMasterTracking,
  writeSheetCell,
} from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { resetSheetCache } from "../utils/sheetCache.js";

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

    if (!raw) return res.status(404).json({ error: "Student not found" });

    const profile = {
      student_id:
        raw["Matric"] ||
        raw["Matric No"] ||
        raw["Student ID"] ||
        "",
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

    /* ---------- DOCUMENTS ---------- */
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
    DOCUMENT_KEYS.forEach(key => {
      documents[key] = raw[key] ? String(raw[key]).trim() : "";
    });

    /* ---------- TIMELINE ---------- */
    const timeline = buildTimelineForRow(raw).map(t => ({
      ...t,
      remark: raw[`${t.activity} - Remark`] || "",
    }));

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

/* ================= UPDATE ACTUAL + REMARK ================= */
router.post("/update-actual", auth, async (req, res) => {
  try {
    const { activity, date, remark } = req.body;
    if (!activity) return res.status(400).json({ error: "Missing activity" });

    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );

    if (idx === -1)
      return res.status(404).json({ error: "Student not found" });

    if (date !== undefined) {
      await writeSheetCell(
        process.env.SHEET_ID,
        "MasterTracking",
        `${activity} - Actual`,
        idx + 2,
        date
      );
    }

    if (remark !== undefined) {
      await writeSheetCell(
        process.env.SHEET_ID,
        "MasterTracking",
        `${activity} - Remark`,
        idx + 2,
        remark
      );
    }

    resetSheetCache();
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/* ================= UPDATE DOCUMENT ================= */
router.post("/update-document", auth, async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: "Missing key" });

    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );

    if (idx === -1)
      return res.status(404).json({ error: "Student not found" });

    await writeSheetCell(
      process.env.SHEET_ID,
      "MasterTracking",
      key,
      idx + 2,
      value || ""
    );

    resetSheetCache();
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
