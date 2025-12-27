import { readFINALPROGRAMPLO } from "../services/googleSheets.js";

/**
 * Programme-level CQI
 * SOURCE OF TRUTH: FINALPROGRAMPLO
 * RULE:
 * - Graduated students only
 * - Achieved = FINAL PLO >= 3.0
 * - Programme Achieved if ≥ 70% of TOTAL graduates achieved
 */
export async function computeProgrammeCQI(programme, sheetId) {
  const rows = await readFINALPROGRAMPLO(sheetId);

  // 1️⃣ Filter programme + graduated students
  const students = rows.filter(
    r =>
      String(r.Programme || "").trim() === programme &&
      String(r.Status || "").trim() === "Graduated"
  );

  const totalGraduates = students.length;
  const plo = {};

  // 2️⃣ Programme aggregation (TOTAL graduates as denominator)
  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;

    const assessed = students.filter(
      s => !isNaN(Number(s[key]))
    );

    const achieved = students.filter(
      s => !isNaN(Number(s[key])) && Number(s[key]) >= 3
    ).length;

    const assessedCount = assessed.length;

    const percent = totalGraduates
      ? (achieved / totalGraduates) * 100
      : null;

    plo[key] = {
      achieved,                 // number achieving ≥ 3
      assessed: assessedCount,  // number with valid data
      total: totalGraduates,    // TOTAL graduates (benchmark base)
      percent: percent !== null ? Number(percent.toFixed(1)) : null,
      benchmark: "≥ 70% of graduates",
      status:
        percent === null
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
