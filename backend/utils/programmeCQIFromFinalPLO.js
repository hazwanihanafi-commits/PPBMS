import {
  readASSESSMENT_PLO,
  readMasterTracking
} from "../services/googleSheets.js";

import { aggregateFinalPLO } from "./finalPLOAggregate.js";

/**
 * Programme-level CQI (FINAL, CORRECT)
 * Rule:
 * - Graduated status → MasterTracking
 * - PLO scores → ASSESSMENT_PLO
 * - Achievement ≥ 3
 * - Programme threshold = 70%
 */
export async function computeProgrammeCQI(programme, sheetId) {

  /* ===============================
     1️⃣ LOAD DATA
  =============================== */
  const assessmentRows = await readASSESSMENT_PLO(sheetId);
  const masterRows = await readMasterTracking(sheetId);

  /* ===============================
     2️⃣ GET GRADUATED STUDENTS (MASTER)
  =============================== */
  const graduatedEmails = new Set(
    masterRows
      .filter(r => String(r["Status"] || "").trim() === "Graduated")
      .map(r =>
        (r["Student's Email"] || "").toLowerCase().trim()
      )
  );

  /* ===============================
     3️⃣ FILTER ASSESSMENT DATA BY PROGRAMME
  =============================== */
  const programmeRows = assessmentRows.filter(
    r => String(r.programme || "").trim() === programme
  );

  /* ===============================
     4️⃣ GROUP ASSESSMENTS BY STUDENT
  =============================== */
  const byStudent = {};
  programmeRows.forEach(r => {
    const email = String(r.student_s_email || "").toLowerCase().trim();
    if (!email) return;
    if (!byStudent[email]) byStudent[email] = [];
    byStudent[email].push(r);
  });

  /* ===============================
     5️⃣ FINAL PLO PER GRADUATED STUDENT
  =============================== */
  const finalPLOPerStudent = [];

  Object.entries(byStudent).forEach(([email, records]) => {
    if (!graduatedEmails.has(email)) return;

    const cqiByAssessment = {};

    records.forEach(r => {
      const type = r.assessment_type || "UNKNOWN";
      if (!cqiByAssessment[type]) cqiByAssessment[type] = {};

      for (let i = 1; i <= 11; i++) {
        const key = `PLO${i}`;
        const v = Number(r[key]);
        if (!isNaN(v)) {
          cqiByAssessment[type][key] = { average: v };
        }
      }
    });

    finalPLOPerStudent.push(
      aggregateFinalPLO(cqiByAssessment)
    );
  });

  /* ===============================
     6️⃣ PROGRAMME CQI (70% RULE)
  =============================== */
  const totalGraduates = finalPLOPerStudent.length;
  const plo = {};

  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;

    const achieved = finalPLOPerStudent.filter(
      s => s[key]?.status === "Achieved"
    ).length;

    const percent = totalGraduates
      ? (achieved / totalGraduates) * 100
      : null;

    plo[key] = {
      achieved,
      assessed: totalGraduates,
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

  return {
    programme,
    graduates: totalGraduates,
    plo
  };
}
