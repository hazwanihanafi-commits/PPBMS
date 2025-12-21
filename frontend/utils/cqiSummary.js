export function aggregateOverallPLO(cqi) {
  if (!cqi || typeof cqi !== "object") return [];

  // example aggregation logic
  const result = {};

  Object.values(cqi).forEach((item) => {
    if (!item.plo || item.score == null) return;
    result[item.plo] = result[item.plo] || [];
    result[item.plo].push(item.score);
  });

  return Object.entries(result).map(([plo, scores]) => ({
    plo,
    average:
      scores.reduce((a, b) => a + b, 0) / scores.length,
  }));
}
