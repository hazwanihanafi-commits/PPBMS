import express from "express";
import jwt from "jsonwebtoken";
import { readASSESSMENT_PLO } from "../services/googleSheets.js";
import { computeFinalStudentPLO } from "../utils/computeFinalStudentPLO.js";

const router = express.Router();

/* =========================
   ADMIN AUTH
========================= */
function adminAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* =================================================
   GET PROGRAMMES (WORKING)
================================================= */
router.get("/programmes", adminAuth, async (req, res) => {
  const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

  const programmes = [
    ...new Set(
      rows
        .map(r => String(r["Programme"] || "").trim())
        .filter(Boolean)
    ),
  ].sort();

  res.json({ programmes });
});

/* =================================================
   PROGRAMME CQI (FINAL, CORRECT)
================================================= */
router.get("/programme-cqi", adminAuth, async (req, res) => {
  const programme = String(req.query.programme || "").trim();
  if (!programme) {
    return res.status(400).json({ error: "Programme required" });
  }

  const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

  /* 1️⃣ FILTER PROGRAMME */
  const programmeRows = rows.filter(
    r => String(r["Programme"] || "").trim() === programme
  );

  /* 2️⃣ GROUP BY STUDENT */
  const byStudent = {};
  programmeRows.forEach(r => {
    const email = String(r["Student's Email"] || "").toLowerCase().trim();
    if (!email) return;
    if (!byStudent[email]) byStudent[email] = [];
    byStudent[email].push(r);
  });

  /* 3️⃣ FINAL PLO PER STUDENT */
  const finalStudents = Object.entries(byStudent)
    .map(([email, records]) => {
      const finalPLO = computeFinalStudentPLO(records);
      const status = String(records[0]["Status"] || "").toLowerCase();
      return { email, status, finalPLO };
    })
    .filter(s => s.status === "graduated"); // programme CQI = graduates only

  /* 4️⃣ AGGREGATE PROGRAMME FINAL PLO */
  const summary = {};
  for (let i = 1; i <= 11; i++) {
    summary[`PLO${i}`] = { achieved: 0, total: finalStudents.length };
  }

  finalStudents.forEach(s => {
    for (let i = 1; i <= 11; i++) {
      const v = s.finalPLO[`PLO${i}`];
      if (typeof v === "number" && v >= 3) {
        summary[`PLO${i}`].achieved++;
      }
    }
  });

  /* 5️⃣ FORMAT WITH 70% RULE */
  const result = {};
  Object.entries(summary).forEach(([plo, d]) => {
    const percent = d.total ? (d.achieved / d.total) * 100 : null;
    result[plo] = {
      achieved: d.achieved,
      total: d.total,
      percent: percent ? Number(percent.toFixed(1)) : null,
      status:
        d.total === 0
          ? "Not Assessed"
          : percent >= 70
          ? "Achieved"
          : percent >= 50
          ? "Borderline"
          : "CQI Required",
    };
  });

  res.json({
    programme,
    graduates: finalStudents.length,
    plo: result,
  });
});

export default router;
