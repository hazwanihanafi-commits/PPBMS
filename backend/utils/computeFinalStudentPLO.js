export function computeFinalStudentPLO(assessmentRows = []) {
  const totals = {};
  const counts = {};

  for (let i = 1; i <= 11; i++) {
    totals[`PLO${i}`] = 0;
    counts[`PLO${i}`] = 0;
  }

  assessmentRows.forEach(r => {
    for (let i = 1; i <= 11; i++) {
      const key = `PLO${i}`;
      const v = Number(r[key]);
      if (!isNaN(v)) {
        totals[key] += v;
        counts[key] += 1;
      }
    }
  });

  const result = {};
  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;
    if (counts[key] === 0) {
      result[key] = { average: null, status: "Not Assessed" };
    } else {
      const avg = totals[key] / counts[key];
      result[key] = {
        average: Number(avg.toFixed(2)),
        status: avg >= 3 ? "Achieved" : "CQI Required"
      };
    }
  }

  return result;
}
