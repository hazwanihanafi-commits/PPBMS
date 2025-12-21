export function aggregateFinalPLO(cqiByAssessment) {
  const map = {};

  Object.values(cqiByAssessment).forEach(assessment => {
    Object.entries(assessment).forEach(([plo, d]) => {
      if (!map[plo]) map[plo] = [];
      if (typeof d.average === "number") {
        map[plo].push(d.average);
      }
    });
  });

  const result = {};
  Object.entries(map).forEach(([plo, arr]) => {
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    result[plo] = {
      average: Number(avg.toFixed(2)),
      status: avg >= 3 ? "Achieved" : "CQI Required"
    };
  });

  return result;
}
