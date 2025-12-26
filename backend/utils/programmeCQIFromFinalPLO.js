// backend/utils/programmeCQIFromFinalPLO.js

import { readASSESSMENT_PLO } from "../services/googleSheets.js";
import { aggregateFinalPLO } from "./finalPLOAggregate.js";

/**
 * Programme-level CQI
 * Rule:
 * - Use FINAL PLO per student
 * - Count % of GRADUATED students achieving each PLO (>= 3)
 * - 70% benchmark
 */
export async function computeProgrammeCQI(programme, sheetId) {
  const rows = await readASSESSMENT_PLO(sheetId);

  /* 1️⃣ Filter programme */
  const programmeRows = rows.filter(
    r => String(r["Programme"] || "").trim() === programme
  );

  /* 2️⃣ Group by student */
  const byStudent = {};
  programmeRows.forEach(r => {
    const email = String(r["Student's Email"] || "").toLowerCase().trim();
    if (!email) return;
    if (!byStudent[email]) byStudent[email] = [];
    byStudent[email].push(r);
  });

  /* 3️⃣ Final PLO per GRADUATED student */
  const finalPLOPerStudent = [];

  Object.values(byStudent).forEach(records => {
    const isGraduated = records.some(
      r => String(r["Status"] || "").toLowerCase() === "graduated"
    );
    if (!isGraduated) return;

    const cqiByAssessment = {};

    records.forEach(r => {
      const type = r["assessment_type"] || "UNKNOWN";
      if (!cqiByAssessment[type]) cqiByAssessment[type] = {};

      for (let i = 1; i <= 11; i++) {
        const key = `PLO${i}`;
        const v = Number(r[key]);
        if (!isNaN(v)) {
          cqiByAssessment[type][key] = { average: v };
        }
      }
    });

    finalPLOPerStudent.push(aggregateFinalPLO(cqiByAssessment));
  });

  /* 4️⃣ Programme aggregation (MQA 70%) */
  const result = {};
  const totalGraduates = finalPLOPerStudent.length;

  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;

    const achieved = finalPLOPerStudent.filter(
      s => s[key]?.status === "Achieved"
    ).length;

    const percent = totalGraduates
      ? (achieved / totalGraduates) * 100
      : null;

    result[key] = {
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
    plo: result
  };
}
