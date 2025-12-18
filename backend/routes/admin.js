import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet, resetSheetCache } from "../utils/sheetCache.js";
import { readMasterTracking, writeSheetCell } from "../services/googleSheets.js";

const router = express.Router();

/* ================= ADMIN AUTH ================= */
function adminOnly(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    if (data.role !== "admin")
      return res.status(401).json({ error: "Admin only" });
    req.user = data;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ================= DOCUMENT MAP ================= */
const DOC_COLUMN_MAP = {
  "Development Plan & Learning Contract (DPLC)": "DPLC",
  "Student Supervision Logbook": "SUPERVISION_LOG",
  "Annual Progress Review – Year 1": "APR_Y1",
  "Annual Progress Review – Year 2": "APR_Y2",
  "Annual Progress Review – Year 3 (Final Year)": "APR_Y3",
  "Ethics Approval": "ETHICS_APPROVAL",
  "Publication Acceptance": "PUBLICATION_ACCEPTANCE",
  "Proof of Submission": "PROOF_OF_SUBMISSION",
  "Conference Presentation": "CONFERENCE_PRESENTATION",
  "Thesis Notice": "THESIS_NOTICE",
  "Viva Report": "VIVA_REPORT",
  "Correction Verification": "CORRECTION_VERIFICATION",
  "Final Thesis": "FINAL_THESIS",
};

/* ============================================================
   ✅ AT-RISK STUDENTS (CACHED – KEEP THIS)
============================================================ */
router.get("/at-risk", adminOnly, async (req, res) => {
  try {
    const rows = await getCachedSheet(process.env.SHEET_ID);
    const today = new Date();
    const atRisk = [];

    rows.forEach((row) => {
      const student = {
        name: row["Student Name"] || "-",
        email: row["Student's Email"] || "-",
        supervisor: row["Main Supervisor"] || "-",
        lateActivities: [],
      };

      Object.keys(row).forEach((col) => {
        if (col.endsWith(" - Expected")) {
          const activity = col.replace(" - Expected", "");
          const expected = row[col];
          const actual = row[`${activity} - Actual`];

          if (expected && !actual && new Date(expected) < today) {
            student.lateActivities.push({ activity, expected });
          }
        }
      });

      if (student.lateActivities.length > 0) atRisk.push(student);
    });

    res.json({ atRisk });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   ✅ ADMIN VIEW ONE STUDENT (LIVE – FIXED)
============================================================ */
router.get("/student/:email", adminOnly, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) return res.status(404).json({ error: "Student not found" });

    const documents = {};
    Object.entries(DOC_COLUMN_MAP).forEach(([label, col]) => {
      documents[label] = raw[col] || "";
    });

    res.json({
      row: {
        student_name: raw["Student Name"] || "-",
        email: raw["Student's Email"] || "-",
        programme: raw["Programme"] || "-",
        department: raw["Department"] || "-",
        documents,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   ✅ ADMIN SAVE / REMOVE DOCUMENT (LIVE)
============================================================ */
router.post("/save-document", adminOnly, async (req, res) => {
  try {
    const { student_email, document_type, file_url } = req.body;

    const column = DOC_COLUMN_MAP[document_type];
    if (!column) return res.status(400).json({ error: "Invalid document type" });

    const rows = await readMasterTracking(process.env.SHEET_ID);
    const idx = rows.findIndex(
      r =>
        (r["Student's Email"] || "").toLowerCase().trim() ===
        student_email.toLowerCase().trim()
    );

    if (idx === -1) return res.status(404).json({ error: "Student not found" });

    await writeSheetCell(
      process.env.SHEET_ID,
      column,
      idx + 2,
      file_url || ""
    );

    resetSheetCache(); // refresh dashboard summaries

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
