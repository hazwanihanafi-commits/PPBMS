import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

router.get("/programme-plo", async (req, res) => {
  try {
    const { programme, cohort, status } = req.query;

    const rows = await readMasterTracking(process.env.SHEET_ID);

    // normalize
    const norm = (v) => (v || "").toString().trim();

    // filter rows
    const filtered = rows.filter(r => {
      if (programme && norm(r["Programme"]) !== programme) return false;
      if (cohort && norm(r["Intake Year"]) !== cohort) return false;
      if (status && norm(r["Status"]) !== status) return false;
      return true;
    });

    const ploKeys = ["PLO1","PLO2","PLO3","PLO4","PLO5","PLO6","PLO7","PLO8"];
    const totals = {};
    const counts = {};

    ploKeys.forEach(p => {
      totals[p] = 0;
      counts[p] = 0;
    });

    filtered.forEach(r => {
      ploKeys.forEach(p => {
        const v = Number(r[p]);
        if (!isNaN(v)) {
          totals[p] += v;
          counts[p]++;
        }
      });
    });

    const plo = ploKeys.map(p => ({
      plo: p,
      average: counts[p] ? +(totals[p] / counts[p]).toFixed(1) : 0
    }));

    const overallAvg =
      plo.reduce((s, p) => s + p.average, 0) / (plo.length || 1);

    const benchmark = 70;
    const achieved = plo.filter(p => p.average >= benchmark).length;
    const atRisk = plo.length - achieved;

    const cqi = plo
      .filter(p => p.average < benchmark)
      .map(p => `${p.plo} below benchmark`)
      .join("; ") || "All PLOs achieved benchmark";

    res.json({
      summary: {
        students: filtered.length,
        avgOverall: +overallAvg.toFixed(1),
        achieved,
        atRisk
      },
      plo,
      cqi
    });

  } catch (err) {
    console.error("PROGRAMME PLO ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
