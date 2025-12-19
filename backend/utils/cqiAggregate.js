export function deriveCQIByAssessment(rows) {
  if (!rows || rows.length === 0) return {};

  const result = {};

  // detect PLO columns safely
  const ploKeys = Object.keys(rows[0]).filter(
    k => /^plo\d+$/.test(k)
  );

  ploKeys.forEach(plo => {
    const values = rows
      .map(r => r[plo])
      .filter(v => typeof v === "number" && !isNaN(v));

    if (values.length === 0) return;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    result[plo.toUpperCase()] = {
      average: Number(avg.toFixed(2)),
      status: avg >= 3 ? "Achieved" : "CQI Required"
    };
  });

  return result;
}
