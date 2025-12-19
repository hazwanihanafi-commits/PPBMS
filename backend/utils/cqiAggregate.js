// backend/utils/cqiAggregate.js

export function deriveCQIByAssessment(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return {};

  const PLO_KEYS = [
    "PLO1","PLO2","PLO3","PLO4","PLO5",
    "PLO6","PLO7","PLO8","PLO9","PLO10","PLO11"
  ];

  const result = {};

  rows.forEach(row => {
    PLO_KEYS.forEach(plo => {
      const raw = row[plo];
      if (raw === "" || raw === undefined) return;

      const score = Number(raw);
      if (Number.isNaN(score)) return;

      if (score >= 70) result[plo] = "GREEN";
      else if (score >= 46) result[plo] = "AMBER";
      else result[plo] = "RED";
    });
  });

  return result;
}
