export function extractCQIIssues(cqiAssessment = {}) {
  return Object.entries(cqiAssessment)
    .filter(([_, d]) => d?.status === "CQI Required")
    .map(([plo, d]) => ({
      plo,
      average: d.average
    }));
}
