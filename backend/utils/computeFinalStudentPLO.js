// backend/utils/computeFinalStudentPLO.js

export function computeFinalStudentPLO(studentRows = []) {
  const ploScores = {};

  // initialise
  for (let i = 1; i <= 11; i++) {
    ploScores[`PLO${i}`] = [];
  }

  // collect scores across ALL assessments
  studentRows.forEach(row => {
    for (let i = 1; i <= 11; i++) {
      const v = Number(row[`PLO${i}`]);
      if (!isNaN(v)) {
        ploScores[`PLO${i}`].push(v);
      }
    }
  });

  // compute final status
  const finalPLO = {};

  Object.entries(ploScores).forEach(([plo, scores]) => {
    if (scores.length === 0) {
      finalPLO[plo] = {
        average: null,
        status: "Not Assessed",
      };
      return;
    }

    const avg =
      scores.reduce((a, b) => a + b, 0) / scores.length;

    finalPLO[plo] = {
      average: Number(avg.toFixed(2)),
      status: avg >= 3 ? "Achieved" : "Not Achieved",
    };
  });

  return finalPLO;
}
