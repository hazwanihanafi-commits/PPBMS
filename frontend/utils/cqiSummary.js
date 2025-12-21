// utils/cqiSummary.js
export function aggregateOverallPLO(cqi) {
  if (!cqi || typeof cqi !== "object") return [];

  const ploMap = {};

  Object.values(cqi).forEach((assessment) => {
    if (!assessment || typeof assessment !== "object") return;

    Object.entries(assessment).forEach(([plo, data]) => {
      const value = Number(data?.average ?? data?.avg);
      if (Number.isNaN(value)) return;

      if (!ploMap[plo]) ploMap[plo] = [];
      ploMap[plo].push(value);
    });
  });

  return Object.entries(ploMap).map(([plo, values]) => {
    const avg =
      values.reduce((sum, v) => sum + v, 0) / values.length;

    return {
      plo,
      average: Number(avg.toFixed(2)),
      status: avg < 3 ? "CQI Required" : "Achieved",
    };
  });
}
