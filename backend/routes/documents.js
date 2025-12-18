import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import jwt from "jsonwebtoken";

import {
  getMyDocuments,
  getDocumentsByStudent,
  saveLink as saveHistoryLink,
} from "../services/documentsService.js";

import {
  readMasterTracking,
  writeSheetCell,
} from "../services/googleSheets.js";

const router = express.Router();

/* =====================================================
   MASTER TRACKING COLUMN MAP
===================================================== */
const COLUMN_MAP = {
  "Development Plan & Learning Contract (DPLC)": "DPLC",
  "Student Supervision Logbook": "SUPERVISION_LOG",
  "Annual Progress Review – Year 1": "APR_Y1",
  "Annual Progress Review – Year 2": "APR_Y2",
  "Annual Progress Review – Year 3 (Final Year)": "APR_Y3",
};

/* =====================================================
   STUDENT: GET OWN DOCUMENT HISTORY (READ ONLY)
===================================================== */
router.get("/my", verifyToken, async (req, res) => {
  try {
    const docs = await getMyDocuments(req.user.email);
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

/* =====================================================
   SUPERVISOR: GET STUDENT DOCUMENT HISTORY
===================================================== */
router.get("/student/:email", verifyToken, async (req, res) => {
  try {
    const docs = await getDocumentsByStudent(req.params.email);
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

/* =====================================================
   SAVE LINK
   ✔ Save history (DOCUMENTS sheet)
   ✔ Save checklist (MASTER TRACKING)
===================================================== */
router.post("/save-link", verifyToken, async (req, res) => {
  try {
    const {
      section = "Monitoring & Supervision",
      document_type,
      file_url,
      student_email, // optional (for supervisor)
    } = req.body;

    if (!document_type || !file_url) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    /* ---------- 1️⃣ Determine target student ---------- */
    const targetEmail =
      req.user.role === "supervisor" && student_email
        ? student_email
        : req.user.email;

    /* ---------- 2️⃣ Save history (DOCUMENTS sheet) ---------- */
    await saveHistoryLink({
      studentEmail: targetEmail,
      section,
      documentType: document_type,
      fileUrl: file_url,
      uploadedBy: req.user.role || "student",
    });

    /* ---------- 3️⃣ Update MASTER TRACKING ---------- */
    const column = COLUMN_MAP[document_type];
    if (!column) {
      return res.status(400).json({ error: "Invalid document type" });
    }

    const rows = await readMasterTracking(process.env.SHEET_ID);
    const idx = rows.findIndex(
      r =>
        (r["Student's Email"] || "").toLowerCase().trim() ===
        targetEmail.toLowerCase().trim()
    );

    if (idx === -1) {
      return res.status(404).json({ error: "Student not found" });
    }

    await writeSheetCell(
      process.env.SHEET_ID,
      column,
      idx + 2,
      file_url
    );

    /* ---------- 4️⃣ Done ---------- */
    res.json({
      ok: true,
      document_type,
      file_url,
    });
  } catch (err) {
    console.error("save-link error:", err);
    res.status(500).json({ error: "Save failed" });
  }
});

export default router;
