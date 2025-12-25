export function detectCQIFromAssessment(rows, threshold = 3) {
  const issues = [];

  for (let i = 1; i <= 11; i++) {
    const values = rows
      .map(r => r[`plo${i}`])
      .filter(v => typeof v === "number");

    if (values.length === 0) continue;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    if (avg < threshold) {
      issues.push({
        plo: `PLO${i}`,
        average: Number(avg.toFixed(2)),
        reason: "Below threshold"
      });
    }
  }

  return issues;
}
