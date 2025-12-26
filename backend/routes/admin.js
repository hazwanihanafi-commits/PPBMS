import express from "express";
import jwt from "jsonwebtoken";
import { readASSESSMENT_PLO } from "../services/googleSheets.js";
import { computeFinalStudentPLO } from "../utils/computeFinalStudentPLO.js";
import { aggregateProgrammeFinalPLO } from "../utils/aggregateProgrammeFinalPLO.js";

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
   PROGRAMME FINAL CQI (70% BENCHMARK)
================================================= */
router.get("/programme-cqi", adminAuth, async (req, res) => {
  const programme = (req.query.programme || "").trim();
  if (!programme) {
    return res.status(400).json({ error: "Programme required" });
  }

  const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

  // 1️⃣ Filter by programme ONLY
  const programmeRows = rows.filter(
    r => String(r.programme).trim() === programme
  );

  // 2️⃣ Group by student
  const byStudent = {};
  programmeRows.forEach(r => {
    if (!r.student_email) return;
    if (!byStudent[r.student_email]) {
      byStudent[r.student_email] = [];
    }
    byStudent[r.student_email].push(r);
  });

  // 3️⃣ Compute final PLO per graduated student
  const finalStudents = [];

  Object.entries(byStudent).forEach(([email, studentRows]) => {
    const isGraduated = studentRows.some(
      r => String(r.status).toLowerCase() === "graduated"
    );

    if (!isGraduated) return; // 🚨 ONLY HERE we filter

    finalStudents.push({
      email,
      finalPLO: computeFinalStudentPLO(studentRows),
    });
  });

  // 4️⃣ Aggregate programme CQI (70% benchmark)
  const programmeCQI = aggregateProgrammeFinalPLO(finalStudents);

  res.json({
    programme,
    totalGraduatedStudents: finalStudents.length,
    students: finalStudents,
    plo: programmeCQI,
  });
});

export default router;
