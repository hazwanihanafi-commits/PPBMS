export function aggregateOverallPLO(cqiByAssessment) {
  const ploMap = {};

  Object.values(cqiByAssessment).forEach(assessment => {
    Object.entries(assessment).forEach(([plo, d]) => {
      if (!ploMap[plo]) {
        ploMap[plo] = { total: 0, count: 0 };
      }
      if (typeof d.average === "number") {
        ploMap[plo].total += d.average;
        ploMap[plo].count += 1;
      }
    });
  });

  return Object.entries(ploMap).map(([plo, v]) => {
    const avg = v.count ? +(v.total / v.count).toFixed(2) : 0;
    return {
      plo,
      average: avg,
      status: avg >= 3 ? "Achieved" : "CQI Required"
    };
  });
}
