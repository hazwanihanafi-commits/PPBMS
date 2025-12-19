// backend/utils/cqi.js

function cqiFromPercent(score) {
  if (score >= 70) return "GREEN";
  if (score >= 60) return "AMBER";
  return "RED";
}

function cqiFromLevel(level) {
  if (level >= 4) return "GREEN";   // Baik / Cemerlang
  if (level === 3) return "AMBER";  // Memuaskan
  return "RED";                     // Lemah / Kurang Memuaskan
}

/**
 * assessments = array of rows from ASSESSMENT_PLO
 */
function deriveCQI(assessments) {
  const cqi = {};

  // priority: TRX500 → Annual Review → Viva (Viva overrides)
  assessments.forEach(row => {
    const isPercent = row.Scoring_Type === "Percent";

    for (let i = 1; i <= 11; i++) {
      const key = `PLO${i}`;
      const value = Number(row[key]);

      if (!value) continue;

      cqi[key] = isPercent
        ? cqiFromPercent(value)
        : cqiFromLevel(value);
    }
  });

  return cqi;
}

module.exports = { deriveCQI };
