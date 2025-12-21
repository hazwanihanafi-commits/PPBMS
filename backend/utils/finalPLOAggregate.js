export function aggregateFinalPLO(cqiByAssessment) {
  const ploMap = {};

  Object.values(cqiByAssessment || {}).forEach(assessment => {
    Object.entries(assessment || {}).forEach(([plo, d]) => {
      if (!d?.average) return;
      if (!ploMap[plo]) ploMap[plo] = [];
      ploMap[plo].push(d.average);
    });
  });

  const final = {};
  Object.entries(ploMap).forEach(([plo, avgs]) => {
    const avg = avgs.reduce((a, b) => a + b, 0) / avgs.length;
    final[plo] = {
      average: Number(avg.toFixed(2)),
      status: avg >= 3 ? "Achieved" : "CQI Required"
    };
  });

  return final;
}
