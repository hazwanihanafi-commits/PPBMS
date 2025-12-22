import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking, writeSheetCell } from "../services/googleSheets.js";
import { getCachedSheet, resetSheetCache } from "../utils/sheetCache.js";

const router = express.Router();

/* ======================================================
   ADMIN AUTH MIDDLEWARE
====================================================== */
function adminOnly(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ======================================================
   DOCUMENT → COLUMN MAP
====================================================== */
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

/* ======================================================
   GET ALL STUDENTS (ADMIN DASHBOARD)
====================================================== */
router.get("/students", adminOnly, async (req, res) => {
  try {
    const rows = await getCachedSheet(process.env.SHEET_ID);

    const students = rows.map(r => ({
      name: r["Student Name"] || "",
      email: r["Student's Email"] || "",
      programme: r["Programme"] || "",
      status: r["Status"] || "Active",
      progressPercent: Number(r["Overall Progress"] || 0),
    }));

    res.json({ students });
  } catch (e) {
    console.error("ADMIN STUDENTS ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ======================================================
   GET SINGLE STUDENT (ADMIN VIEW)
====================================================== */
router.get("/student/:email", adminOnly, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );

    if (!raw) return res.status(404).json({ error: "Student not found" });

    const documents = {};
    Object.entries(DOC_COLUMN_MAP).forEach(([label, col]) => {
      documents[label] = raw[col] || "";
    });

    res.json({
      row: {
        student_name: raw["Student Name"],
        email: raw["Student's Email"],
        programme: raw["Programme"],
        department: raw["Department"],
        status: raw["Status"] || "Active",
        documents,
      },
    });
  } catch (e) {
    console.error("ADMIN STUDENT ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ======================================================
   SAVE / REMOVE DOCUMENT (ADMIN)
====================================================== */
router.post("/save-document", adminOnly, async (req, res) => {
  try {
    const { student_email, document_type, file_url } = req.body;

    const column = DOC_COLUMN_MAP[document_type];
    if (!column) {
      return res.status(400).json({ error: "Invalid document type" });
    }

    const rows = await readMasterTracking(process.env.SHEET_ID);
    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase() === student_email.toLowerCase()
    );

    if (idx === -1) return res.status(404).json({ error: "Student not found" });

    await writeSheetCell(
      process.env.SHEET_ID,
      column,
      idx + 2,
      file_url || ""
    );

    resetSheetCache();
    res.json({ success: true });
  } catch (e) {
    console.error("ADMIN SAVE DOC ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ======================================================
   PROGRAMME-LEVEL PLO (ADMIN DASHBOARD)
   URL:
   /api/admin/programme-plo?programme=Doctor of Philosophy
   /api/admin/programme-plo?programme=Master of Science
====================================================== */
router.get("/programme-plo", adminOnly, async (req, res) => {
  try {
    const programmeFilter = (req.query.programme || "").trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const PLOS = [
      "PLO1","PLO2","PLO3","PLO4","PLO5",
      "PLO6","PLO7","PLO8","PLO9","PLO10","PLO11"
    ];

    const agg = {};
    PLOS.forEach(p => (agg[p] = { total: 0, count: 0 }));

    rows.forEach(r => {
      if (programmeFilter && r["Programme"] !== programmeFilter) return;

      PLOS.forEach(p => {
        const v = Number(r[p]);
        if (!isNaN(v)) {
          agg[p].total += v;
          agg[p].count += 1;
        }
      });
    });

    const result = {};
    PLOS.forEach(p => {
      const avg = agg[p].count
        ? +(agg[p].total / agg[p].count).toFixed(2)
        : 0;

      result[p] = {
        average: avg,
        status: avg >= 3 ? "Achieved" : "At Risk",
      };
    });

    res.json({ plo: result });
  } catch (e) {
    console.error("PROGRAMME PLO ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
