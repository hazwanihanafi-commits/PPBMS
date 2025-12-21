export function aggregateFinalPLO(cqiByAssessment) {
  const sums = {};
  const counts = {};

  Object.values(cqiByAssessment).forEach(assessment => {
    Object.entries(assessment).forEach(([plo, d]) => {
      if (d.average == null) return;

      sums[plo] = (sums[plo] || 0) + d.average;
      counts[plo] = (counts[plo] || 0) + 1;
    });
  });

  const final = {};
  Object.keys(sums).forEach(plo => {
    const avg = Number((sums[plo] / counts[plo]).toFixed(2));

    final[plo] = {
      average: avg,
      status: avg >= 3 ? "Achieved" : "CQI Required"
    };
  });

  return final;
}
