export function generateCQINarrative(ploSummary = []) {
  if (!ploSummary.length) {
    return "No CQI data available for analysis.";
  }

  const weak = ploSummary.filter((p) => p.average < 3);
  const strong = ploSummary.filter((p) => p.average >= 4);

  let text = "";

  if (strong.length) {
    text += `Strong achievement observed in ${strong
      .map((p) => p.plo)
      .join(", ")}. `;
  }

  if (weak.length) {
    text += `Improvement actions required for ${weak
      .map((p) => p.plo)
      .join(", ")}.`;
  }

  return text || "Overall PLO achievement is satisfactory.";
}
