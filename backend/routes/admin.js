import express from "express";
import jwt from "jsonwebtoken";

import {
  readMasterTracking,
  readFINALPROGRAMPLO,
  readASSESSMENT_PLO
} from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";

const router = express.Router();

/* ==========================================
   AUTH
========================================== */
function adminAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ==========================================
   🔥 SINGLE SOURCE LOGIC (SUPERVISOR SAME)
========================================== */
function normalizeStatus(raw) {
  const s = String(raw || "").toLowerCase().trim();

  if (s === "active") return "ACTIVE";
  if (s === "graduated") return "GRADUATED";
  if (s.includes("suspension")) return "SUSPENDED";
  if (s.includes("terminated")) return "TERMINATED";

  return "UNKNOWN";
}

function calculateProgress(row) {

  const timeline =
    buildTimelineForRow(row);

  if (!timeline || timeline.length === 0) {
    return 0;
  }

  const completed =
    timeline.filter(t =>
      String(t.status || "")
        .toUpperCase()
        .trim() === "COMPLETED"
    ).length;

  return Math.round(
    (completed / timeline.length) * 100
  );
}

function getStudentCategory(row) {

  const status = String(
    row.Status || ""
  )
    .toLowerCase()
    .trim();

  // 🎓 graduated
  if (
    status === "graduated" ||
    status === "completed"
  ) {
    return "GRADUATED";
  }

  const progress =
    calculateProgress(row);

  // ✅ EXACT SUPERVISOR LOGIC
  if (progress >= 80) {
    return "ON_TRACK";
  }

  if (progress >= 50) {
    return "SLIGHTLY_DELAYED";
  }

  return "AT_RISK";
}

function normalizeProgramme(p) {
  return String(p || "").toUpperCase().trim();
}

/* ==========================================
   PROGRAMMES
========================================== */
router.get("/programmes", adminAuth, async (req, res) => {

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const programmes = [
    ...new Set(
      rows.map(r => normalizeProgramme(r.Programme)).filter(Boolean)
    )
  ];

  res.json({ programmes });
});

/* ==========================================
   🔥 CORE ENGINE (USED BY BOTH ENDPOINTS)
========================================== */
function processStudents(rows, programme) {

  const result = [];
  const seen = new Set();

  rows.forEach(r => {

    const prog =
      normalizeProgramme(r.Programme);

    const status =
      normalizeStatus(r.Status);

    if (
      prog !== normalizeProgramme(programme)
    ) return;

    if (
      status !== "ACTIVE" &&
      status !== "GRADUATED"
    ) return;

    const emailKey =
      (
        r["Student's Email"] || ""
      )
        .toLowerCase()
        .trim();

    if (seen.has(emailKey)) {
      return;
    }

    seen.add(emailKey);

    const timeline =
      buildTimelineForRow(r);

    const overall =
      getStudentCategory(r);

    result.push({

      matric:
        r.Matric || "",

      name:
        r["Student Name"] || "",

      email: emailKey,

      status,

      overallStatus:
        overall,

      progressPercent:
        calculateProgress(r),

      timeline

    });

  });

  return result;
}

/* ==========================================
   SUMMARY
========================================== */
router.get("/programme-summary", adminAuth, async (req, res) => {

  const { programme } = req.query;

  const rows =
    await readMasterTracking(
      process.env.SHEET_ID
    );

  const students =
    processStudents(rows, programme);

  let onTrack = 0,
      delayed = 0,
      atRisk = 0,
      graduated = 0;

  students.forEach(s => {

    if (s.status === "GRADUATED") {
      graduated++;
      return;
    }

    if (s.overallStatus === "AT_RISK") {
      atRisk++;
    }
    else if (
      s.overallStatus === "SLIGHTLY_DELAYED"
    ) {
      delayed++;
    }
    else {
      onTrack++;
    }

  });

  res.json({
    onTrack,
    slightlyDelayed: delayed,
    atRisk,
    graduated
  });

});

/* ==========================================
   STUDENT LIST
========================================== */
router.get("/programme-students", adminAuth, async (req, res) => {

  const { programme } = req.query;

  const rows =
    await readMasterTracking(
      process.env.SHEET_ID
    );

  const students =
    processStudents(rows, programme);

  res.json({
    count: students.length,
    students
  });

});

/* ==========================================
   PLO SUMMARY
========================================== */
router.get("/programme-plo", adminAuth, async (req, res) => {

  const { programme } = req.query;

  const master =
    await readMasterTracking(
      process.env.SHEET_ID
    );

  const ploRows =
    await readFINALPROGRAMPLO(
      process.env.SHEET_ID
    );

  const graduatedEmails = new Set(
    master
      .filter(r =>
        normalizeProgramme(r.Programme) ===
        normalizeProgramme(programme) &&
        normalizeStatus(r.Status) ===
        "GRADUATED"
      )
      .map(r =>
        String(
          r["Student's Email"] || ""
        )
          .toLowerCase()
          .trim()
      )
  );

  const valid = ploRows.filter(r =>
    graduatedEmails.has(
      String(
        r["Student's Email"] || ""
      )
        .toLowerCase()
        .trim()
    )
  );

  const totals = {},
        counts = {};

  valid.forEach(r => {

    for (let i = 1; i <= 11; i++) {

      const key = `PLO${i}`;
      const val = parseFloat(r[key]);

      if (!isNaN(val)) {

        totals[key] =
          (totals[key] || 0) + val;

        counts[key] =
          (counts[key] || 0) + 1;
      }
    }

  });

  const plos = {};

  Object.keys(totals).forEach(k => {
    plos[k] =
      (
        totals[k] / counts[k]
      ).toFixed(2);
  });

  res.json({
    count: valid.length,
    plos
  });

});

/* ==========================================
   ALL ASSESSMENT PLO SUMMARY
========================================== */

router.get(
  "/programme-plo-all",
  adminAuth,
  async (req, res) => {

    try {

      const { programme } = req.query;

      /* =====================================
         READ MASTER
      ===================================== */

      const master =
        await readMasterTracking(
          process.env.SHEET_ID
        );

      /* =====================================
         READ ASSESSMENT PLO
      ===================================== */

      const assessmentRows =
        await readASSESSMENT_PLO(
          process.env.SHEET_ID
        );

      /* =====================================
         VALID STUDENTS IN PROGRAMME
      ===================================== */

      const validMatric = new Set(

        master
          .filter(r =>

            normalizeProgramme(
              r.Programme
            ) ===
            normalizeProgramme(
              programme
            )

          )
          .map(r =>

            String(
              r.Matric || ""
            )
              .trim()

          )

      );

      /* =====================================
         GROUP
      ===================================== */

      const grouped = {};

      assessmentRows.forEach(r => {

        const matric =
          String(
            r.Matric ||
            r.matric ||
            ""
          )
            .trim();

        if (
          !validMatric.has(matric)
        ) {
          return;
        }

        const instance =
          String(

            r.Assessment_Instance ||
            r.assessment_instance ||

            r.Assessment_Type ||
            r.assessment_type ||

            ""

          )
            .toUpperCase()
            .trim();

        if (!instance) {
          return;
        }

        if (!grouped[instance]) {
          grouped[instance] = {};
        }

        /* ================================
           PLO LOOP
        ================================ */

        for (let i = 1; i <= 11; i++) {

          const key = `PLO${i}`;

          const raw =
            r[key] ||
            r[key.toLowerCase()];

          const val =
            parseFloat(raw);

          if (isNaN(val)) {
            continue;
          }

          if (
            !grouped[instance][key]
          ) {
            grouped[instance][key] = [];
          }

          grouped[instance][key]
            .push(val);

        }

      });

      /* =====================================
         AVERAGE
      ===================================== */

      const result = {};

      Object.entries(grouped)
        .forEach(([instance, plos]) => {

          result[instance] = {};

          Object.entries(plos)
            .forEach(([plo, arr]) => {

              const avg =
                arr.reduce(
                  (a, b) => a + b,
                  0
                ) / arr.length;

              result[instance][plo] =
                Number(
                  avg.toFixed(2)
                );

            });

        });

      /* =====================================
         RESPONSE
      ===================================== */

      res.json({

        programme,

        assessmentCount:
          Object.keys(grouped).length,

        assessments:
          result

      });

    } catch (e) {

      console.error(
        "programme-plo-all error:",
        e
      );

      res.status(500).json({
        error: e.message
      });

    }

  }
);

export default router;
