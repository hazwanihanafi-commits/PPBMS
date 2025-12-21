// utils/cqiNarrative.js
export function generateCQINarrative(ploSummary) {
  if (!Array.isArray(ploSummary) || ploSummary.length === 0) {
    return "";
  }

  const achieved = ploSummary
    .filter(p => p.status === "Achieved")
    .map(p => p.plo);

  const cqiRequired = ploSummary
    .filter(p => p.status === "CQI Required")
    .map(p => p.plo);

  let narrative = "";

  if (achieved.length > 0) {
    narrative += `The following PLOs have been achieved: ${achieved.join(", ")}. `;
  }

  if (cqiRequired.length > 0) {
    narrative += `CQI is required for ${cqiRequired.join(", ")} to improve student outcomes.`;
  }

  return narrative.trim();
}
