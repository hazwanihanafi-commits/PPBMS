export function aggregateProgrammePLO(students = []) {
  const acc = {};

  students.forEach(st => {
    const finalPLO = st.finalPLO || {};

    Object.entries(finalPLO).forEach(([plo, d]) => {
      if (!d || d.average == null) return;

      if (!acc[plo]) {
        acc[plo] = { total: 0, count: 0 };
      }

      acc[plo].total += Number(d.average);
      acc[plo].count += 1;
    });
  });

  const result = {};
  Object.entries(acc).forEach(([plo, v]) => {
    result[plo] = Number((v.total / v.count).toFixed(2));
  });

  return result;
}
