export function deriveCQIByAssessment(assessments) {
  if (!Array.isArray(assessments)) return {};

  const trx = assessments.filter(
    a => a.Assessment_Type === "TRX500"
  );

  if (trx.length === 0) return {};

  const ploTotals = {};
  const ploCounts = {};

  trx.forEach(row => {
    Object.keys(row).forEach(key => {
      if (key.startsWith("PLO") && row[key] !== "" && row[key] !== null) {
        const val = Number(row[key]);
        if (!isNaN(val)) {
          ploTotals[key] = (ploTotals[key] || 0) + val;
          ploCounts[key] = (ploCounts[key] || 0) + 1;
        }
      }
    });
  });

  const result = {};
  Object.keys(ploTotals).forEach(plo => {
    const avg = ploTotals[plo] / ploCounts[plo];

    if (avg >= 46) result[plo] = "GREEN";
    else if (avg >= 40) result[plo] = "AMBER";
    else result[plo] = "RED";
  });

  return result;
}
