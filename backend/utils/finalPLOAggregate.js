export function aggregateFinalPLO(cqiByAssessment = {}) {
  const result = {};

  Object.values(cqiByAssessment).forEach(assessment => {
    Object.entries(assessment).forEach(([plo, d]) => {
      if (!d || d.average == null) return;

      if (!result[plo]) {
        result[plo] = {
          total: d.average,
          count: 1,
          status: d.status
        };
      } else {
        result[plo].total += d.average;
        result[plo].count += 1;

        // If ANY assessment requires CQI → final CQI Required
        if (d.status === "CQI Required") {
          result[plo].status = "CQI Required";
        }
      }
    });
  });

  // Finalize averages
  Object.keys(result).forEach(plo => {
    result[plo].average = Number(
      (result[plo].total / result[plo].count).toFixed(2)
    );
    delete result[plo].total;
    delete result[plo].count;
  });

  return result;
}
