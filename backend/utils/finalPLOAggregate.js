export function aggregateFinalPLO(cqiByAssessment = {}) {
  const result = {};

  Object.values(cqiByAssessment).forEach(assessment => {
    Object.entries(assessment).forEach(([plo, d]) => {
      if (!d || d.average == null) return;

      if (!result[plo]) {
        result[plo] = {
          total: d.average,
          count: 1
        };
      } else {
        result[plo].total += d.average;
        result[plo].count += 1;
      }
    });
  });

  // Finalize averages + status
  Object.keys(result).forEach(plo => {
    const avg = result[plo].total / result[plo].count;

    result[plo] = {
      average: Number(avg.toFixed(2)),
      status: avg >= 3.0 ? "Achieved" : "CQI Required"
    };
  });

  return result;
}
