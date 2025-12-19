// backend/utils/cqi.js

function cqiFromPercent(v) {
  if (v >= 70) return "GREEN";
  if (v >= 60) return "AMBER";
  return "RED";
}

function cqiFromLevel(v) {
  if (v >= 4) return "GREEN";
  if (v === 3) return "AMBER";
  return "RED";
}

/**
 * @param {Array<Object>} assessments rows from ASSESSMENT_PLO
 */
export function deriveCQI(assessments) {
  const cqi = {};

  // priority order: TRX500 → Annual Review → Viva
  const order = { TRX500: 1, "Annual Review": 2, Viva: 3 };

  assessments
    .sort((a, b) => order[a.Assessment_Type] - order[b.Assessment_Type])
    .forEach(row => {
      const isPercent = row.Scoring_Type === "Percent";

      for (let i = 1; i <= 11; i++) {
        const key = `PLO${i}`;
        const raw = Number(row[key]);

        if (!raw) continue;

        cqi[key] = isPercent
          ? cqiFromPercent(raw)
          : cqiFromLevel(raw);
      }
    });

  return cqi;
}
