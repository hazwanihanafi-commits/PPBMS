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
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* =========================
   FINAL PLO PER STUDENT
   (Average across ALL assessments)
========================= */
function computeFinalStudentPLO(records) {
  const result = {};

  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;

    const values = records
      .map(r => Number(r[key]))
      .filter(v => !isNaN(v));

    const average =
      values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null;

    result[key] = {
      average,
      status:
        average === null
          ? "Not Assessed"
          : average >= 3
          ? "Achieved"
          : "CQI Required",
    };
  }

  return result;
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
   PROGRAMME CQI (FINAL, CORRECT, MQA-COMPLIANT)
================================================= */
router.get("/programme-plo", adminAuth, async (req, res) => {
  const programme = String(req.query.programme || "").trim();
  if (!programme) {
    return res.status(400).json({ error: "Programme required" });
  }

  const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

  // 1️⃣ Group records by student (programme only)
  const byStudent = {};
  rows
    .filter(r => String(r.programme || "").trim() === programme)
    .forEach(r => {
      const email = String(r.student_s_email || "").toLowerCase().trim();
      if (!email) return;
      if (!byStudent[email]) byStudent[email] = [];
      byStudent[email].push(r);
    });

  // 2️⃣ Keep ONLY graduated students
  const graduatedStudents = Object.values(byStudent)
    .filter(records =>
      records.some(r => String(r.status || "").toLowerCase() === "graduated")
    )
    .map(records => computeFinalStudentPLO(records)); // 🔑 FINAL PLO

  const totalGraduates = graduatedStudents.length;

  // 3️⃣ Programme CQI aggregation (FROM FINAL PLO)
  const plo = {};
  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;

    const achieved = graduatedStudents.filter(
      s => s[key]?.status === "Achieved"
    ).length;

    const percent = totalGraduates
      ? (achieved / totalGraduates) * 100
      : null;

    plo[key] = {
      assessed: totalGraduates,
      achieved,
      percent: percent !== null ? Number(percent.toFixed(1)) : null,
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
export default router;
