import {
  readASSESSMENT_PLO,
  readMasterTracking
} from "../services/googleSheets.js";

import { aggregateFinalPLO } from "./finalPLOAggregate.js";

/**
 * Programme-level CQI (FINAL, MQA-COMPLIANT)
 */
export async function computeProgrammeCQI(programme, sheetId) {

  /* ===============================
     1️⃣ LOAD DATA
  =============================== */
  const assessmentRows = await readASSESSMENT_PLO(sheetId);
  const masterRows = await readMasterTracking(sheetId);

  /* ===============================
     2️⃣ GRADUATED STUDENTS (MASTER)
  =============================== */
  const graduatedEmails = new Set(
    masterRows
      .filter(
        r => String(r.status || "").toLowerCase().trim() === "graduated"
      )
      .map(
        r => (r.student_s_email || "").toLowerCase().trim()
      )
      .filter(Boolean)
  );

  /* ===============================
     3️⃣ FILTER BY PROGRAMME
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
        const v = Number(r[`plo${i}`]);
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
  const plo = {};
  const totalGraduates = finalPLOPerStudent.length;

  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;

    const assessedStudents = finalPLOPerStudent.filter(
      s => s[key] && s[key].average !== null
    );

    const achieved = assessedStudents.filter(
      s => s[key].status === "Achieved"
    ).length;

    const assessed = assessedStudents.length;

    const percent = assessed
      ? (achieved / assessed) * 100
      : null;

    plo[key] = {
      achieved,
      assessed,
      percent: percent !== null ? Number(percent.toFixed(1)) : null,
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

  return {
    programme,
    graduates: totalGraduates,
    plo
  };
}
