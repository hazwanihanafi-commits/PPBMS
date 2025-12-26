/**
 * Programme-level FINAL PLO aggregation
 * Benchmark: ≥70% of graduated students achieved
 */
export function aggregateProgrammeFinalPLO(studentFinalPLOList) {
  /**
   * studentFinalPLOList = [
   *   { studentEmail, finalPLO },
   *   { studentEmail, finalPLO },
   *   ...
   * ]
   */

  const programmeStats = {};

  // initialise PLO1–PLO11
  for (let i = 1; i <= 11; i++) {
    programmeStats[`PLO${i}`] = {
      achievedStudents: 0,
      totalStudents: studentFinalPLOList.length,
      percent: null,
      status: "Not Assessed"
    };
  }

  // count achievements
  studentFinalPLOList.forEach(({ finalPLO }) => {
    if (!finalPLO) return;

    Object.entries(finalPLO).forEach(([plo, d]) => {
      if (d.status === "Achieved") {
        programmeStats[plo].achievedStudents += 1;
      }
    });
  });

  // compute percentage & CQI status
  Object.entries(programmeStats).forEach(([plo, d]) => {
    if (d.totalStudents === 0) return;

    const percent = (d.achievedStudents / d.totalStudents) * 100;
    d.percent = Number(percent.toFixed(1));

    d.status =
      percent >= 70
        ? "Achieved"
        : percent >= 50
        ? "Borderline"
        : "CQI Required";
  });

  return programmeStats;
}
