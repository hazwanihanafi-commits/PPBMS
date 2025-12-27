import {
  readASSESSMENT_PLO,
  readMasterTracking
} from "../services/googleSheets.js";

import { computeFinalStudentPLO } from "./computeFinalStudentPLO.js";

/**
 * Programme-level CQI
 * RULE:
 * - Use FINAL PLO per student
 * - Graduated students only (MasterTracking)
 * - Achieved = FINAL PLO >= 3
 * - Programme achieved if >= 70%
 */
export async function computeProgrammeCQI(programme, sheetId) {
  const assessmentRows = await readASSESSMENT_PLO(sheetId);
  const masterRows = await readMasterTracking(sheetId);

  /* 1️⃣ Graduated students */
  const graduatedEmails = new Set(
    masterRows
      .filter(r => String(r["Status"] || "") === "Graduated")
      .map(r =>
        (r["Student's Email"] || "").toLowerCase().trim()
      )
  );

  /* 2️⃣ Filter assessment by programme */
  const programmeRows = assessmentRows.filter(
    r => String(r.programme || "").trim() === programme
  );

  /* 3️⃣ Group by student */
  const byStudent = {};
  programmeRows.forEach(r => {
    const email = String(r.student_s_email || "").toLowerCase().trim();
    if (!email || !graduatedEmails.has(email)) return;

    if (!byStudent[email]) byStudent[email] = [];
    byStudent[email].push(r);
  });

  /* 4️⃣ Final PLO per student */
  const finalPLOPerStudent = Object.values(byStudent).map(records =>
    computeFinalStudentPLO(records)
  );

  const plo = {};

  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;

    const assessed = finalPLOPerStudent.filter(
      s => s[key]?.average !== null
    );

    const achieved = assessed.filter(
      s => s[key].average >= 3
    ).length;

    const percent = assessed.length
      ? (achieved / assessed.length) * 100
      : null;

    plo[key] = {
      assessed: assessed.length,
      achieved,
      percent: percent !== null ? Number(percent.toFixed(1)) : null,
      status:
        assessed.length === 0
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
    graduates: finalPLOPerStudent.length,
    plo
  };
}
