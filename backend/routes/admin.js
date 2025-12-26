import express from "express";
import jwt from "jsonwebtoken";
import { readASSESSMENT_PLO } from "../services/googleSheets.js";
import { computeFinalStudentPLO } from "../utils/computeFinalStudentPLO.js";
import { aggregateFinalPLO } from "../utils/finalPLOAggregate.js";

const router = express.Router();

/* =========================
   ADMIN AUTH
========================= */
function adminAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* =================================================
   GET PROGRAMMES (ADMIN DROPDOWN)
================================================= */
router.get("/programmes", adminAuth, async (req, res) => {
  const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

  const programmes = [
    ...new Set(
      rows
        .map(r => String(r.programme || "").trim())
        .filter(Boolean)
    ),
  ].sort();

  res.json({ programmes });
});

/* =================================================
   PROGRAMME CQI (MATCHES FRONTEND programme-plo)
================================================= */
router.get("/programme-plo", adminAuth, async (req, res) => {
  const programme = String(req.query.programme || "").trim();
  if (!programme) {
    return res.status(400).json({ error: "Programme required" });
  }

  const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

  /* =========================
     1️⃣ FILTER PROGRAMME
  ========================= */
  const programmeRows = rows.filter(
    r => String(r["Programme"] || "").trim() === programme
  );

  /* =========================
     2️⃣ GROUP BY STUDENT
  ========================= */
  const byStudent = {};
  programmeRows.forEach(r => {
    const email = String(r["Student's Email"] || "").toLowerCase().trim();
    if (!email) return;
    if (!byStudent[email]) byStudent[email] = [];
    byStudent[email].push(r);
  });

  /* =========================
     3️⃣ FINAL PLO PER GRADUATED STUDENT
  ========================= */
  const graduatedFinalPLOs = [];

  Object.values(byStudent).forEach(records => {
    const isGraduated = records.some(
      r => String(r["Status"] || "").toLowerCase() === "graduated"
    );
    if (!isGraduated) return;

    // Build CQI-by-assessment (same as supervisor)
    const cqiByAssessment = {};

    records.forEach(r => {
      const assessment = String(r["assessment_type"] || "").trim();
      if (!assessment) return;

      cqiByAssessment[assessment] = {};
      for (let i = 1; i <= 11; i++) {
        const v = Number(r[`PLO${i}`]);
        if (!isNaN(v)) {
          cqiByAssessment[assessment][`PLO${i}`] = v;
        }
      }
    });

    const finalPLO = aggregateFinalPLO(cqiByAssessment);

    // 🔒 NORMALISE (CRITICAL)
    for (let i = 1; i <= 11; i++) {
      if (!finalPLO[`PLO${i}`]) {
        finalPLO[`PLO${i}`] = { average: null, status: "Not Assessed" };
      }
    }

    graduatedFinalPLOs.push(finalPLO);
  });

  /* =========================
     4️⃣ PROGRAMME CQI (70% RULE)
  ========================= */
  const programmeCQI = {};

  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;

    const assessed = graduatedFinalPLOs.filter(
      s => typeof s[key].average === "number"
    ).length;

    const achieved = graduatedFinalPLOs.filter(
      s => typeof s[key].average === "number" && s[key].average >= 3
    ).length;

    const percent = assessed ? (achieved / assessed) * 100 : null;

    programmeCQI[key] = {
      assessed,
      achieved,
      percent: percent ? Number(percent.toFixed(1)) : null,
      status:
        assessed === 0
          ? "Not Assessed"
          : percent >= 70
          ? "Achieved"
          : percent >= 50
          ? "Borderline"
          : "CQI Required"
    };
  }

  res.json({
    programme,
    graduates: graduatedFinalPLOs.length,
    plo: programmeCQI
  });
});
/* =================================================
   PROGRAMME STUDENT LIST (ADMIN TABLE)
================================================= */
router.get("/programme-students", adminAuth, async (req, res) => {
  const programme = String(req.query.programme || "").trim();
  if (!programme) {
    return res.status(400).json({ error: "Programme required" });
  }

  const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

  const students = rows
    .filter(r => String(r.programme || "").trim() === programme)
    .map(r => ({
      studentEmail: r.student_email,
      matric: r.matric,
      assessmentType: r.assessment_type,
      status: r.status,
    }));

  res.json({ students });
});

export default router;
