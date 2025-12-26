// backend/utils/aggregateProgrammeFinalPLO.js

export function aggregateProgrammeFinalPLO(studentFinalPLOList = []) {
  const ploStats = {};

  // initialise
  for (let i = 1; i <= 11; i++) {
    ploStats[`PLO${i}`] = {
      achieved: 0,
      total: 0,
    };
  }

  // count achievement per student
  studentFinalPLOList.forEach(({ finalPLO }) => {
    Object.entries(finalPLO || {}).forEach(([plo, d]) => {
      if (d.status === "Not Assessed") return;

      ploStats[plo].total += 1;
      if (d.status === "Achieved") {
        ploStats[plo].achieved += 1;
      }
    });
  });

  // build CQI result
  const result = {};

  Object.entries(ploStats).forEach(([plo, d]) => {
    const percent =
      d.total > 0 ? (d.achieved / d.total) * 100 : null;

    result[plo] = {
      achievedStudents: d.achieved,
      totalStudents: d.total,
      percent: percent ? Number(percent.toFixed(1)) : null,
      status:
        d.total === 0
          ? "Not Assessed"
          : percent >= 70
          ? "Achieved"
          : "CQI Required",
    };
  });

  return result;
}
