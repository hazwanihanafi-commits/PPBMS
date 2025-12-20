// backend/utils/cqiAggregate.js

/**
 * Derive CQI status per PLO from assessment rows
 * Expected input:
 * [
 *   { PLO1: 4, PLO2: 2, PLO3: null, ... }
 * ]
 */
export function deriveCQIByAssessment(rows = []) {
  const result = {};

  if (!Array.isArray(rows) || rows.length === 0) {
    return result;
  }

  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;

    // collect valid numeric scores only
    const values = rows
      .map(r => Number(r[key]))
      .filter(v => !isNaN(v));

    if (values.length === 0) continue;

    const avg =
      values.reduce((sum, v) => sum + v, 0) / values.length;

    result[key] = {
      average: Number(avg.toFixed(2)),
      status: avg >= 3 ? "Achieved" : "CQI Required"
    };
  }

  return result;
}
