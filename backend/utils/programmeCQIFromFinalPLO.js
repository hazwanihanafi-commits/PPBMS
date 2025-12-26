import {
  readASSESSMENT_PLO,
  readMasterTracking
} from "../services/googleSheets.js";

import { computeFinalStudentPLO } from "./computeFinalStudentPLO.js";

/**
 * Programme-level CQI
 * RULE:
 * - Use FINAL PLO per student
 * - Graduated students only
 * - Achieved = FINAL PLO >= 3
 * - Programme achieved if >= 70%
 */
export async function computeProgrammeCQI(programme, sheetId) {
  const assessmentRows = await readASSESSMENT_PLO(sheetId);
  const masterRows = await readMasterTracking(sheetId);

  /* 1️⃣ Get graduated students */
  const graduatedEmails = new Set(
    masterRows
      .filter(r => String(r["Status"] || "").trim() === "Graduated")
      .map(r =>
        (r["Student's Email"] || "").toLowerCase().trim()
      )
  );

  /* 2️⃣ Filter assessment rows by programme */
  const programmeRows = assessmentRows.filter(
    r => String(r.programme || "").trim() === programme
  );

  /* 3️⃣ Group assessment rows by student */
  const byStudent = {};
  programmeRows.forEach(r => {
    const email = String(r.student_s_email || "")
      .toLowerCase()
      .trim();
    if (!email) return;

    if (!byStudent[email]) byStudent[email] = [];
    byStudent[email].push(r);
  });

  /* 4️⃣ Compute FINAL PLO per graduated student */
const finalPLOPerStudent = [];

Object.entries(byStudent).forEach(([email, records]) => {
  if (!graduatedEmails.has(email)) return;

  const assessments = {};

  records.forEach(r => {
    const type = r.assessment_type || "UNKNOWN";
    if (!assessments[type]) assessments[type] = {};

    for (let i = 1; i <= 11; i++) {
      const key = `PLO${i}`;
      const v = Number(r[key]);
      if (!isNaN(v)) {
        assessments[type][key] = { average: v };
      }
    }
  });

  // 🔴 THIS is the FINAL PLO table
  finalPLOPerStudent.push(
    aggregateFinalPLO(assessments)
  );
});

  /* 5️⃣ Programme CQI (70% rule) */
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

  return {
    programme,
    graduates: totalGraduates,
    plo
  };
}
