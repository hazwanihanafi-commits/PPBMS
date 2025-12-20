export function deriveCQIByAssessment(rows = []) {
  const result = {};

  if (!Array.isArray(rows) || rows.length === 0) {
    return result;
  }

  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;

    const values = rows
      .map(r => r[key])
      .filter(v => v !== null && v !== undefined && !isNaN(v));

    // ⛔ skip only if truly no data
    if (values.length === 0) continue;

    const avg =
      values.reduce((sum, v) => sum + Number(v), 0) / values.length;

    result[key] = {
      average: Number(avg.toFixed(2)),
      status: avg >= 3.0 ? "Achieved" : "CQI Required"
    };
  }

  return result;
}
