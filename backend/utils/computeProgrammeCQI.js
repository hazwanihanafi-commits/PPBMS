import {
  readASSESSMENT_PLO,
  readMasterTracking
} from "../services/googleSheets.js";

import { computeFinalStudentPLO } from "./computeFinalStudentPLO.js";

/**
 * Programme-level CQI
 * RULE (MQA-compliant):
 * - Use FINAL PLO per student
 * - Graduated students only
 * - Achieved = FINAL PLO average >= 3
 * - Programme achieved if ≥ 70% of graduates achieved
 */
export async function computeProgrammeCQI(programme, sheetId) {
  /* ===============================
     1️⃣ LOAD DATA
  =============================== */
  const assessmentRows = await readASSESSMENT_PLO(sheetId);
  const masterRows = await readMasterTracking(sheetId);

  /* ===============================
     2️⃣ GET GRADUATED STUDENTS (MASTER TRACKING)
  =============================== */
  const graduatedEmails = new Set(
    masterRows
      .filter(r =>
        String(r["Status"] || "").trim().toLowerCase() === "graduated"
      )
      .map(r =>
        (r["Student's Email"] || "").toLowerCase().trim()
      )
  );

  /* ===============================
     3️⃣ FILTER ASSESSMENTS BY PROGRAMME
  =============================== */
  const programmeRows = assessmentRows.filter(
    r => String(r.programme || "").trim() === programme
  );

  /* ===============================
     4️⃣ GROUP ASSESSMENTS BY STUDENT
  =============================== */
  const byStudent = {};
  programmeRows.forEach(r => {
    const email = String(r.student_s_email || "")
      .toLowerCase()
      .trim();

    if (!email) return;

    if (!byStudent[email]) byStudent[email] = [];
    byStudent[email].push(r);
  });

  /* ===============================
     5️⃣ FINAL PLO PER GRADUATED STUDENT
     (THIS MATCHES SUPERVISOR FINAL PLO TABLE)
  =============================== */
  const finalPLOPerStudent = [];

  Object.entries(byStudent).forEach(([email, records]) => {
    if (!graduatedEmails.has(email)) return;

    const finalPLO = computeFinalStudentPLO(records);
    finalPLOPerStudent.push(finalPLO);
  });

  const totalGraduates = finalPLOPerStudent.length;

  /* ===============================
     6️⃣ PROGRAMME CQI (70% RULE)
  =============================== */
  const plo = {};

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

  /* ===============================
     7️⃣ RETURN PROGRAMME CQI
  =============================== */
  return {
    programme,
    graduates: totalGraduates,
    plo
  };
}
