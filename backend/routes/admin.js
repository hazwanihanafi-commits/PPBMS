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
        .map(r => String(r["Programme"] || "").trim())
        .filter(Boolean)
    ),
  ].sort();

  res.json({ programmes });
});

/* =================================================
   PROGRAMME FINAL CQI (70% BENCHMARK)
   ✔ Uses FINAL PLO per student
   ✔ Aggregated at programme level
================================================= */
router.get("/programme-cqi", adminAuth, async (req, res) => {
  const programme = (req.query.programme || "").trim();
  if (!programme) {
    return res.status(400).json({ error: "Programme required" });
  }

  const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

  /* ---------------------------------------------
     1️⃣ FILTER BY PROGRAMME + GRADUATED
  --------------------------------------------- */
  const programmeRows = rows.filter(r =>
    String(r["Programme"] || "").trim() === programme &&
    String(r["Status"] || "").toLowerCase() === "graduated"
  );

  /* ---------------------------------------------
     2️⃣ GROUP BY STUDENT EMAIL
  --------------------------------------------- */
  const byStudent = {};
  programmeRows.forEach(r => {
    const email = String(r["Student's Email"] || "").trim();
    if (!email) return;

    if (!byStudent[email]) byStudent[email] = [];
    byStudent[email].push(r);
  });

  /* ---------------------------------------------
     3️⃣ COMPUTE FINAL PLO PER STUDENT
     (REUSE SUPERVISOR LOGIC)
  --------------------------------------------- */
  const finalStudentPLOs = Object.values(byStudent).map(studentRows =>
    computeFinalStudentPLO(studentRows)
  );

  /* ---------------------------------------------
     4️⃣ AGGREGATE PROGRAMME FINAL PLO (70% RULE)
  --------------------------------------------- */
  const programmeFinalPLO = aggregateProgrammeFinalPLO(finalStudentPLOs);

  res.json({
    programme,
    totalGraduatedStudents: finalStudentPLOs.length,
    finalPLO: programmeFinalPLO
  });
});

export default router;
