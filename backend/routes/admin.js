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

  /* 3️⃣ FINAL PLO PER GRADUATED STUDENT (PLO ASSESSMENTS ONLY) */
  const graduates = Object.values(byStudent)
    .map(records => {
      const graduated = records.some(
        r => String(r["Status"] || "").toLowerCase() === "graduated"
      );
      if (!graduated) return null;

      // 🔑 ONLY ASSESSMENTS THAT CONTAIN PLO SCORES
      const ploRecords = records.filter(r =>
        ["TRX500", "VIVA", "THESIS"].includes(
          String(r["assessment_type"] || "").toUpperCase()
        )
      );

      if (ploRecords.length === 0) return null;

      return computeFinalStudentPLO(ploRecords);
    })
    .filter(Boolean);

  /* 4️⃣ PROGRAMME CQI (70% BENCHMARK) */
  const plo = {};
  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;

    const assessed = graduates.filter(
      g => typeof g[key] === "number"
    ).length;

    const achieved = graduates.filter(
      g => typeof g[key] === "number" && g[key] >= 3
    ).length;

    const percent = assessed ? (achieved / assessed) * 100 : null;

    plo[key] = {
      assessed,
      achieved,
      percent: percent !== null ? Number(percent.toFixed(1)) : null,
      status:
        assessed === 0
          ? "Not Assessed"
          : percent >= 70
          ? "Achieved"
          : percent >= 50
          ? "Borderline"
          : "CQI Required",
    };
  }

  res.json({
    programme,
    graduates: graduates.length,
    plo,
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
