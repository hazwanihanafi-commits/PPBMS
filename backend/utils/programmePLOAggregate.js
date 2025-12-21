export function aggregateProgrammePLO(studentFinalPLOs = []) {
  const result = {};

  studentFinalPLOs.forEach(finalPLO => {
    Object.entries(finalPLO || {}).forEach(([plo, d]) => {
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

        // If ANY student requires CQI → programme CQI Required
        if (d.status === "CQI Required") {
          result[plo].status = "CQI Required";
        }
      }
    });
  });

  // Finalise averages
  Object.keys(result).forEach(plo => {
    result[plo].average = Number(
      (result[plo].total / result[plo].count).toFixed(2)
    );
    delete result[plo].total;
    delete result[plo].count;
  });

  return result;
}
