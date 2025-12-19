/* utils/cqiAggregate.js */

/**
 * Input: array of assessment rows (TRX500 only)
 * Output: { PLO1: "GREEN", PLO2: "AMBER", ... }
 */

export function deriveCQIByAssessment(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return {};

  const result = {};

  // We only care about PLO1–PLO11
  const PLOS = [
    "PLO1","PLO2","PLO3","PLO4","PLO5","PLO6",
    "PLO7","PLO8","PLO9","PLO10","PLO11"
  ];

  PLOS.forEach(plo => {
    // Collect numeric scores for this PLO
    const scores = rows
      .map(r => Number(r[plo]))
      .filter(v => !isNaN(v));

    if (scores.length === 0) return;

    // Average score (percent)
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    // CQI thresholds (based on your rule)
    if (avg >= 70) result[plo] = "GREEN";
    else if (avg >= 46) result[plo] = "AMBER";
    else result[plo] = "RED";
  });

  return result;
}
