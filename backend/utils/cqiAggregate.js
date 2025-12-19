/* utils/cqiAggregate.js */

/**
 * Percent-based CQI classification
 * GREEN ≥ 70
 * AMBER 46–69
 * RED < 46
 */

export function deriveCQIByAssessment(assessments) {
  const result = {};

  if (!Array.isArray(assessments) || assessments.length === 0) {
    return result;
  }

  // Only TRX500 (percent-based)
  const trx = assessments.filter(
    a =>
      (a.Assessment_Type || "").toUpperCase().trim() === "TRX500"
  );

  if (trx.length === 0) return result;

  // Use latest TRX500 record
  const row = trx[trx.length - 1];

  Object.keys(row).forEach((key) => {
    if (!key.startsWith("PLO")) return;

    const value = Number(row[key]);

    if (isNaN(value)) return;

    if (value >= 70) result[key] = "GREEN";
    else if (value >= 46) result[key] = "AMBER";
    else result[key] = "RED";
  });

  return result;
}
