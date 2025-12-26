import express from "express";
import jwt from "jsonwebtoken";
import { readASSESSMENT_PLO } from "../services/googleSheets.js";

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
   GET PROGRAMMES (ADMIN DROPDOWN) ✅
================================================= */
router.get("/programmes", adminAuth, async (req, res) => {
  const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

  const programmes = [
    ...new Set(
      rows
        .map(r => String(r.programme || "").trim())
        .filter(Boolean)
    )
  ].sort();

  res.json({ programmes });
});

/* =================================================
   PROGRAMME CQI (FINAL – PROGRAMME LEVEL) ✅
================================================= */
router.get("/programme-plo", adminAuth, async (req, res) => {
  const programme = String(req.query.programme || "").trim();
  if (!programme) {
    return res.status(400).json({ error: "Programme required" });
  }

  const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

  /* ===============================
     1️⃣ FILTER PROGRAMME
  =============================== */
  const programmeRows = rows.filter(
    r => String(r.programme || "").trim() === programme
  );

  /* ===============================
     2️⃣ GROUP BY STUDENT
  =============================== */
  const byStudent = {};
  programmeRows.forEach(r => {
    const email = String(r.student_s_email || "").toLowerCase().trim();
    if (!email) return;
    if (!byStudent[email]) byStudent[email] = [];
    byStudent[email].push(r);
  });

  /* ===============================
     3️⃣ FINAL PLO PER GRADUATED STUDENT
     (SAME LOGIC AS SUPERVISOR PAGE)
  =============================== */
  const finalStudents = Object.values(byStudent)
    .map(records => {
      const isGraduated = records.some(
        r => String(r.status || "").toLowerCase() === "graduated"
      );
      if (!isGraduated) return null;

      // Prefer THESIS, fallback to VIVA
      const finalRecord =
        records.find(r => r.assessment_type === "THESIS") ||
        records.find(r => r.assessment_type === "VIVA");

      if (!finalRecord) return null;

      return finalRecord;
    })
    .filter(Boolean);

  const totalGraduates = finalStudents.length;

  /* ===============================
     4️⃣ PROGRAMME CQI AGGREGATION
     (≥3 RULE, 70% BENCHMARK)
  =============================== */
  const plo = {};

  for (let i = 1; i <= 11; i++) {
    const key = `plo${i}`;

    const achieved = finalStudents.filter(
      s => Number(s[key]) >= 3
    ).length;

    const percent =
      totalGraduates > 0
        ? (achieved / totalGraduates) * 100
        : null;

    plo[`PLO${i}`] = {
      achieved,
      assessed: totalGraduates,
      percent: percent !== null ? Number(percent.toFixed(2)) : null,
      status:
        totalGraduates === 0
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
    graduates: totalGraduates,
    plo
  });
});

/* =================================================
   PROGRAMME STUDENTS TABLE (ADMIN) ✅
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
      studentEmail: r.student_s_email,
      matric: r.matric,
      assessmentType: r.assessment_type,
      status: r.status
    }));

  res.json({ students });
});

export default router;
