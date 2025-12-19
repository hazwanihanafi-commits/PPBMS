// backend/utils/cqiAggregate.js

export function deriveCQIByAssessment(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return {};

  // Only take TRX500
  const trx = rows.filter(
    r => (r["Assessment_Type"] || "").toUpperCase() === "TRX500"
  );

  if (trx.length === 0) return {};

  const ploStatus = {};

  trx.forEach(row => {
    Object.keys(row).forEach(key => {
      if (!key.startsWith("PLO")) return;

      const value = Number(row[key]);
      if (isNaN(value)) return;

      let status = "RED";
      if (value >= 70) status = "GREEN";
      else if (value >= 46) status = "AMBER";

      // Keep worst status if multiple rows exist
      if (!ploStatus[key]) {
        ploStatus[key] = status;
      } else {
        const rank = { GREEN: 3, AMBER: 2, RED: 1 };
        if (rank[status] < rank[ploStatus[key]]) {
          ploStatus[key] = status;
        }
      }
    });
  });

  return ploStatus;
}
