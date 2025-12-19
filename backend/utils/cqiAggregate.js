/**
 * Normalise score to 0–100
 */
function normaliseScore(value, scoringType) {
  if (value === "" || value === null || value === undefined) return null;

  const v = Number(value);
  if (Number.isNaN(v)) return null;

  if (scoringType === "Level") {
    // Level 1–5 → %
    return (v / 5) * 100;
  }

  // Percent
  return v;
}

/**
 * Derive CQI colour
 */
function cqiColour(score) {
  if (score === null) return null;
  if (score >= 70) return "GREEN";
  if (score >= 60) return "AMBER";
  return "RED";
}

/**
 * CQI PER ASSESSMENT (TRX / APR / VIVA)
 */
export function deriveCQIByAssessment(rows) {
  const result = {};

  rows.forEach(r => {
    const type = r.Assessment_Type;
    if (!result[type]) result[type] = {};

    Object.keys(r).forEach(k => {
      if (!k.startsWith("PLO")) return;

      const score = normaliseScore(r[k], r.Scoring_Type);
      if (score === null) return;

      result[type][k] = cqiColour(score);
    });
  });

  return result;
}

/**
 * CUMULATIVE PLO (FOR SPIDER WEB)
 */
export function deriveCumulativePLO(rows) {
  const ploBucket = {};

  rows.forEach(r => {
    Object.keys(r).forEach(k => {
      if (!k.startsWith("PLO")) return;

      const score = normaliseScore(r[k], r.Scoring_Type);
      if (score === null) return;

      if (!ploBucket[k]) {
        ploBucket[k] = { trx: [], apr: [], viva: [] };
      }

      if (r.Assessment_Type === "TRX500") ploBucket[k].trx.push(score);
      if (r.Assessment_Type === "Annual Review") ploBucket[k].apr.push(score);
      if (r.Assessment_Type === "Viva") ploBucket[k].viva.push(score);
    });
  });

  const radar = {};

  Object.keys(ploBucket).forEach(plo => {
    const trxAvg = avg(ploBucket[plo].trx);
    const aprAvg = avg(ploBucket[plo].apr);
    const vivaAvg = avg(ploBucket[plo].viva);

    let total = 0;
    let weight = 0;

    if (trxAvg !== null) { total += trxAvg * 0.2; weight += 0.2; }
    if (aprAvg !== null) { total += aprAvg * 0.4; weight += 0.4; }
    if (vivaAvg !== null) { total += vivaAvg * 0.4; weight += 0.4; }

    radar[plo] = weight > 0 ? Math.round(total / weight) : null;
  });

  return radar;
}

function avg(arr) {
  if (!arr || arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
