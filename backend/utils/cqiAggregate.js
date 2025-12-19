function scaleToPercent(value) {
  if (value === null || value === undefined || value === "") return null;
  const v = Number(value);
  if (Number.isNaN(v)) return null;
  return (v / 5) * 100;
}

function classifyCQI(percent) {
  if (percent === null) return null;
  if (percent >= 46) return "GREEN";
  if (percent >= 40) return "AMBER";
  return "RED";
}

export function deriveCQIByAssessment(rows) {
  const result = {};

  rows.forEach(row => {
    const scoringType = (row.Scoring_Type || "").toUpperCase();

    Object.keys(row).forEach(key => {
      if (!key.startsWith("PLO")) return;

      let percent = null;

      if (scoringType === "PERCENT") {
        percent = Number(row[key]);
      }

      if (scoringType === "SCALE") {
        percent = scaleToPercent(row[key]);
      }

      if (percent === null || Number.isNaN(percent)) return;

      result[key] = classifyCQI(percent);
    });
  });

  return result;
}
