import express from "express";
import jwt from "jsonwebtoken";
import { readASSESSMENT_PLO } from "../services/googleSheets.js";
import { computeFinalStudentPLO } from "../utils/computeFinalStudentPLO.js";
import { aggregateProgrammeFinalPLO } from "../utils/aggregateProgrammeFinalPLO.js";

const router = express.Router();

/* ======================================================
   ADMIN AUTH MIDDLEWARE
====================================================== */
function adminAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "NO_TOKEN" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== "admin") {
      return res.status(403).json({ error: "FORBIDDEN" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

/* ======================================================
   GET PROGRAMME LIST (FOR DROPDOWN)
====================================================== */
router.get("/programmes", adminAuth, async (req, res) => {
  try {
    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    const programmes = [
      ...new Set(
        rows
          .map(r => String(r["Programme"] || "").trim())
          .filter(Boolean)
      )
    ].sort();

    res.json({ programmes });
  } catch (err) {
    console.error("PROGRAMME LIST ERROR:", err);
    res.status(500).json({ error: "FAILED_TO_LOAD_PROGRAMMES" });
  }
});

/* ======================================================
   PROGRAMME FINAL PLO (CQI – 70% BENCHMARK)
====================================================== */
router.get("/programme-plo", adminAuth, async (req, res) => {
  try {
    const programme = (req.query.programme || "").trim();
    if (!programme) {
      return res.status(400).json({ error: "PROGRAMME_REQUIRED" });
    }

    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    /* ----------------------------------------------
       1️⃣ FILTER: PROGRAMME + GRADUATED STUDENTS
    ---------------------------------------------- */
    const programmeRows = rows.filter(r =>
      String(r["Programme"] || "").trim() === programme &&
      String(r["Status"] || "").toLowerCase() === "graduated"
    );

    /* ----------------------------------------------
       2️⃣ GROUP ROWS BY STUDENT EMAIL
    ---------------------------------------------- */
    const rowsByStudent = {};
    programmeRows.forEach(r => {
      const email = r["Student's Email"];
      if (!email) return;

      if (!rowsByStudent[email]) {
        rowsByStudent[email] = [];
      }
      rowsByStudent[email].push(r);
    });

    /* ----------------------------------------------
       3️⃣ COMPUTE FINAL PLO PER STUDENT
           (REUSE SUPERVISOR LOGIC)
    ---------------------------------------------- */
    const studentFinalPLOList = Object.entries(rowsByStudent).map(
      ([email, studentRows]) => ({
        studentEmail: email,
        finalPLO: computeFinalStudentPLO(studentRows),
      })
    );

    /* ----------------------------------------------
       4️⃣ AGGREGATE TO PROGRAMME LEVEL
           (70% BENCHMARK)
    ---------------------------------------------- */
    const programmeFinalPLO =
      aggregateProgrammeFinalPLO(studentFinalPLOList);

    /* ----------------------------------------------
       5️⃣ RESPONSE
    ---------------------------------------------- */
    res.json({
      programme,
      totalGraduatedStudents: studentFinalPLOList.length,
      finalPLO: programmeFinalPLO,
    });

  } catch (err) {
    console.error("PROGRAMME CQI ERROR:", err);
    res.status(500).json({ error: "PROGRAMME_CQI_FAILED" });
  }
});

export default router;
