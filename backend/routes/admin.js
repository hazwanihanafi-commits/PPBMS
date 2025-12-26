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

  /* 1️⃣ Group by student (REAL field names) */
  const byStudent = {};
  rows
    .filter(r => String(r.programme_name || "").trim() === programme)
    .forEach(r => {
      const email = String(r.student_s_email || "").toLowerCase().trim();
      if (!email) return;
      if (!byStudent[email]) byStudent[email] = [];
      byStudent[email].push(r);
    });

  /* 2️⃣ Graduated students only */
  const finalPLOs = Object.values(byStudent)
    .filter(records =>
      records.some(r => String(r.status || "").toLowerCase() === "graduated")
    )
    .map(records => computeFinalStudentPLO(records));

  const totalGraduates = finalPLOs.length;

  /* 3️⃣ Programme CQI = % students with FINAL PLO ≥ 3 */
  const plo = {};
  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;

    const achieved = finalPLOs.filter(
      s => typeof s[key]?.average === "number" && s[key].average >= 3
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

  res.json({ programme, graduates: totalGraduates, plo });
});
router.get("/programme-students", adminAuth, async (req, res) => {
  const programme = String(req.query.programme || "").trim();
  if (!programme) {
    return res.status(400).json({ error: "Programme required" });
  }

  const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

  const students = rows
    .filter(
      r => String(r["Programme"] || "").trim() === programme
    )
    .map(r => ({
      studentEmail: r["Student's Email"] || "",
      matric: r["Matric"] || "",
      assessmentType: r["Assessment Type"] || "",
      status: r["Status"] || ""
    }));

  res.json({ students });
});

export default router;
