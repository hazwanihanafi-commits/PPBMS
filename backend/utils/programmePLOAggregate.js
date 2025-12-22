export function aggregateProgrammePLO(rows) {
  const ploKeys = Array.from({ length: 11 }, (_, i) => `PLO${i + 1}`);

  const acc = {};
  ploKeys.forEach(p => {
    acc[p] = { total: 0, count: 0 };
  });

  rows.forEach(r => {
    ploKeys.forEach(p => {
      const v = Number(r[p]);
      if (!isNaN(v)) {
        acc[p].total += v;
        acc[p].count += 1;
      }
    });
  });

  const result = {};
  ploKeys.forEach(p => {
    const avg = acc[p].count
      ? +(acc[p].total / acc[p].count).toFixed(2)
      : null;

    result[p] = {
      average: avg,
      status: avg !== null && avg >= 3 ? "Achieved" : "CQI Required",
    };
  });

  return result;
}
