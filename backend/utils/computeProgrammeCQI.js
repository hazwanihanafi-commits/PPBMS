import {
  readASSESSMENT_PLO,
  readMasterTracking
} from "../services/googleSheets.js";

import { computeFinalStudentPLO } from "./computeFinalStudentPLO.js";

export async function computeProgrammeCQI(programme, sheetId) {
  const assessmentRows = await readASSESSMENT_PLO(sheetId);
  const masterRows = await readMasterTracking(sheetId);

  /* 1️⃣ Graduated students only */
  const graduatedEmails = new Set(
    masterRows
      .filter(r => String(r["Status"] || "").trim() === "Graduated")
      .map(r => (r["Student's Email"] || "").toLowerCase().trim())
  );

  /* 2️⃣ Filter assessment rows by programme */
  const programmeRows = assessmentRows.filter(
    r => String(r.programme || "").trim() === programme
  );

  /* 3️⃣ Group assessment rows by student */
  const byStudent = {};
  programmeRows.forEach(r => {
    const email = String(r.student_s_email || "").toLowerCase().trim();
    if (!email || !graduatedEmails.has(email)) return;
    if (!byStudent[email]) byStudent[email] = [];
    byStudent[email].push(r);
  });

  /* 4️⃣ Compute FINAL PLO per student */
  const finalPLOPerStudent = Object.values(byStudent).map(records =>
    computeFinalStudentPLO(records)
  );

  /* 5️⃣ Programme CQI aggregation */
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
      achieved,
      assessed: assessed.length,
      percent: percent ? Number(percent.toFixed(1)) : null,
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
