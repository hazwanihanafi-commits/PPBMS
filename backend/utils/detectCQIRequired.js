export function extractCQIIssues(rows) {
  const issues = [];

  for (let i = 1; i <= 11; i++) {
    const values = rows
      .map(r => r[`plo${i}`])
      .filter(v => typeof v === "number");

    if (values.length === 0) continue;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    if (avg < 3) {
      issues.push({
        plo: `PLO${i}`,
        reason: `Average score ${avg.toFixed(2)} below threshold`
      });
    }
  }

  return issues;
}
