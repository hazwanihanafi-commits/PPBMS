import express from "express";
import jwt from "jsonwebtoken";
import {
  readMasterTracking,
  readAssessmentPLO,
} from "../services/googleSheets.js";
import { aggregateProgrammePLO } from "../utils/programmePLOAggregate.js";

const router = express.Router();

/* =====================================================
   ADMIN AUTH MIDDLEWARE
===================================================== */
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
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* =====================================================
   GET ALL STUDENTS (ADMIN DASHBOARD)
===================================================== */
router.get("/students", adminOnly, async (req, res) => {
  try {
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const students = rows.map(r => ({
      name: r["Student Name"],
      email: r["Student's Email"],
      programme: r["Programme"],
      status: r["Status"] || "Active",
      progressPercent: Number(r["Progress %"] || 0),
    }));

    res.json({ students });
  } catch (err) {
    console.error("ADMIN students error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   PROGRAMME-LEVEL PLO (FROM ASSESSMENT_PLO SHEET)
   GET /api/admin/programme-plo?programme=Doctor of Philosophy
===================================================== */
router.get("/programme-plo", adminOnly, async (req, res) => {
  try {
    const { programme } = req.query;

    if (!programme) {
      return res.status(400).json({ error: "Missing programme" });
    }

    /* 1️⃣ Load data */
    const masterRows = await readMasterTracking(process.env.SHEET_ID);
    const assessmentRows = await readAssessmentPLO(process.env.SHEET_ID);

    /* 2️⃣ Get matric numbers for selected programme */
    const matricSet = new Set(
      masterRows
        .filter(r => r["Programme"] === programme)
        .map(r => String(r["Matric"]).trim())
        .filter(Boolean)
    );

    if (matricSet.size === 0) {
      return res.json({ plo: {} });
    }

    /* 3️⃣ Filter assessment rows */
    const filtered = assessmentRows.filter(r =>
      matricSet.has(String(r["Matric"]).trim())
    );

    if (filtered.length === 0) {
      return res.json({ plo: {} });
    }

    /* 4️⃣ Build per-student FINAL PLO */
    const studentPLOs = [];

    filtered.forEach(r => {
      const plo = {};
      for (let i = 1; i <= 11; i++) {
        const v = Number(r[`PLO${i}`]);
        plo[`PLO${i}`] = isNaN(v) ? null : v;
      }
      studentPLOs.push(plo);
    });

    /* 5️⃣ Aggregate programme PLO */
    const programmePLO = aggregateProgrammePLO(studentPLOs);

    res.json({ plo: programmePLO });

  } catch (err) {
    console.error("ADMIN programme-plo error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
