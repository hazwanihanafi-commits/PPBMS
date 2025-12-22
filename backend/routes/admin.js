import express from "express";
import jwt from "jsonwebtoken";
import {
  readMasterTracking,
  readASSESSMENT_PLO   // ✅ EXACT NAME
} from "../services/googleSheets.js";
import { aggregateProgrammePLO } from "../utils/programmePLOAggregate.js";

const router = express.Router();

/* ================= ADMIN AUTH ================= */
function adminOnly(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    if (data.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }
    req.user = data;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* =========================================================
   GET PROGRAMME-LEVEL PLO (FROM ASSESSMENT_PLO)
   /api/admin/programme-plo?programme=Doctor of Philosophy
========================================================= */
router.get("/programme-plo", adminOnly, async (req, res) => {
  try {
    const { programme } = req.query;
    if (!programme) {
      return res.status(400).json({ error: "Missing programme" });
    }

    // 1️⃣ Load sheets
    const masterRows = await readMasterTracking(process.env.SHEET_ID);
    const assessmentRows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    // 2️⃣ Get matric list for selected programme
    const matricSet = new Set(
      masterRows
        .filter(r => r["Programme"] === programme)
        .map(r => String(r["Matric"]).trim())
        .filter(Boolean)
    );

    if (matricSet.size === 0) {
      return res.json({ plo: {} });
    }

    // 3️⃣ Filter assessment rows
    const filtered = assessmentRows.filter(r =>
      matricSet.has(String(r.matric).trim())
    );

    if (filtered.length === 0) {
      return res.json({ plo: {} });
    }

    // 4️⃣ Build per-student PLO vectors
    const studentPLOs = filtered.map(r => {
      const plo = {};
      for (let i = 1; i <= 11; i++) {
        const key = `plo${i}`;
        const v = r[key];
        plo[`PLO${i}`] = typeof v === "number" ? v : null;
      }
      return plo;
    });

    // 5️⃣ Aggregate to programme level
    const programmePLO = aggregateProgrammePLO(studentPLOs);

    res.json({ plo: programmePLO });

  } catch (err) {
    console.error("ADMIN programme-plo error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
