import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking } from "../services/googleSheets.js";
import { readAssessmentPLO } from "../services/googleSheets.js";
import { aggregateProgrammePLO } from "../utils/programmePLOAggregate.js";

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
   GET ALL STUDENTS (ADMIN DASHBOARD)
====================================================== */
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
  } catch (e) {
    console.error("ADMIN STUDENTS ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ======================================================
   PROGRAMME-LEVEL PLO (FROM ASSESSMENT_PLO) ✅
   GET /api/admin/programme-plo?programme=Doctor of Philosophy
====================================================== */
router.get("/programme-plo", adminOnly, async (req, res) => {
  try {
    const { programme } = req.query;
    if (!programme) {
      return res.status(400).json({ error: "Missing programme" });
    }

    /* 1️⃣ Read ASSESSMENT_PLO sheet */
    const rows = await readAssessmentPLO(process.env.SHEET_ID);

    /* 2️⃣ Filter by programme (MUST MATCH SHEET VALUE EXACTLY) */
    const filtered = rows.filter(r =>
      (r["Programme"] || "").trim() === programme.trim()
    );

    if (filtered.length === 0) {
      return res.json({ plo: null });
    }

    /* 3️⃣ Aggregate programme-level PLO */
    const programmePLO = aggregateProgrammePLO(filtered);

    res.json({ plo: programmePLO });
  } catch (e) {
    console.error("PROGRAMME PLO ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
