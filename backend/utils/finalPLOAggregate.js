// backend/utils/finalPLOAggregate.js

export function aggregateFinalPLO(cqiByAssessment) {
  const accumulator = {};
  const counts = {};

  Object.values(cqiByAssessment).forEach(assessment => {
    Object.entries(assessment).forEach(([plo, d]) => {
      if (d?.average == null) return;

      if (!accumulator[plo]) {
        accumulator[plo] = 0;
        counts[plo] = 0;
      }

      accumulator[plo] += d.average;
      counts[plo] += 1;
    });
  });

  const finalPLO = {};

  Object.keys(accumulator).forEach(plo => {
    const avg = +(accumulator[plo] / counts[plo]).toFixed(2);

    finalPLO[plo] = {
      average: avg,
      status: avg >= 3 ? "Achieved" : "CQI Required"
    };
  });

  return finalPLO;
}
