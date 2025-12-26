import { readASSESSMENT_PLO } from "../services/googleSheets.js";

/**
 * Programme-level CQI
 * Rule:
 * - Final PLO is computed PER STUDENT
 * - Programme CQI = % of GRADUATED students achieving each PLO
 * - Threshold = 70%
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

  /* 3️⃣ Compute FINAL PLO per GRADUATED student */
  const finalPLOStudents = [];

  Object.values(byStudent).forEach(records => {
    const isGraduated = records.some(
      r => String(r["Status"] || "").toLowerCase() === "graduated"
    );
    if (!isGraduated) return;

    const finalPLO = {};

    for (let i = 1; i <= 11; i++) {
      const key = `PLO${i}`;
      const values = records
        .map(r => Number(r[key]))
        .filter(v => !isNaN(v));

      if (!values.length) {
        finalPLO[key] = { average: null, status: "Not Assessed" };
        continue;
      }

      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      finalPLO[key] = {
        average: Number(avg.toFixed(2)),
        status: avg >= 3 ? "Achieved" : "CQI Required"
      };
    }

    finalPLOStudents.push(finalPLO);
  });

  /* 4️⃣ Programme CQI aggregation */
  const totalGraduates = finalPLOStudents.length;
  const programmePLO = {};

  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;

    const achieved = finalPLOStudents.filter(
      s => s[key]?.status === "Achieved"
    ).length;

    const percent = totalGraduates
      ? (achieved / totalGraduates) * 100
      : null;

    programmePLO[key] = {
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
    plo: programmePLO
  };
}
