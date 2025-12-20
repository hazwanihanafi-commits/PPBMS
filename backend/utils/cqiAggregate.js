// backend/utils/cqiAggregate.js
export function deriveCQIByAssessment(rows = []) {
  const result = {};
  if (!rows.length) return result;

  for (let i = 1; i <= 11; i++) {
    const key = `PLO${i}`;

    const values = rows
      .map(r => r[key])
      .filter(v => typeof v === "number" && !isNaN(v));

    // ✅ skip only if absolutely no data
    if (values.length === 0) continue;

    const avg =
      values.reduce((a, b) => a + b, 0) / values.length;

    result[key] = {
      average: Number(avg.toFixed(2)),
      status: avg >= 3.0 ? "Achieved" : "CQI Required"
    };
  }

  return result;
}
