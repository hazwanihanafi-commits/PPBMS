export function generateCQINarrative(ploSummary) {
  const achieved = ploSummary.filter(p => p.status === "Achieved");
  const required = ploSummary.filter(p => p.status !== "Achieved");

  let text = `Based on the aggregated assessment results, the student demonstrated `;

  if (required.length === 0) {
    text += `achievement across all Programme Learning Outcomes (PLOs). `;
  } else {
    text += `achievement in ${achieved.length} PLOs, while ${required.length} PLO(s) `
          + `recorded average scores below the benchmark of 3.0. `;
  }

  required.forEach(p => {
    text += `${p.plo} (Avg ${p.average}) requires targeted intervention. `;
  });

  text += `These findings are consistent with the quantitative results illustrated `
        + `in the PLO average performance chart.`;

  return text;
}
