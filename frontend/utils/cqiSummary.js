// utils/cqiSummary.js
export function aggregateOverallPLO(cqi) {
  if (!cqi || typeof cqi !== "object") return {};

  const ploMap = {};

  Object.values(cqi).forEach(assessment => {
    Object.entries(assessment || {}).forEach(([plo, data]) => {
      if (!ploMap[plo]) ploMap[plo] = [];
      ploMap[plo].push(data.avg);
    });
  });

  const summary = {};
  Object.entries(ploMap).forEach(([plo, avgs]) => {
    const avg =
      avgs.reduce((a, b) => a + b, 0) / avgs.length;

    summary[plo] = {
      avg: Number(avg.toFixed(2)),
      status: avg < 3 ? "CQI Required" : "Achieved",
    };
  });

  return summary;
}
