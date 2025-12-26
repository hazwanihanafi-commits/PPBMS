import { readFinalPLOAggregate } from "./finalPLOAggregate.js";

/**
 * Programme CQI from FINAL PLO (MQA compliant)
 */
export async function computeProgrammeCQI(programme, sheetId) {
  // 🔑 Read FINAL PLO per student (already computed)
  const finalPLORows = await readFinalPLOAggregate(sheetId);

  // 1️⃣ Filter programme + graduated
  const graduates = finalPLORows.filter(
    r =>
      r.programme === programme &&
      String(r.status).toLowerCase() === "graduated"
  );

  const totalGraduates = graduates.length;

  const plo = {};

  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;

    const achieved = graduates.filter(
      s => typeof s[key] === "number" && s[key] >= 3
    ).length;

    const percent = totalGraduates
      ? (achieved / totalGraduates) * 100
      : null;

    plo[key] = {
      assessed: totalGraduates,
      achieved,
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
