import express from "express";
import jwt from "jsonwebtoken";
import { readASSESSMENT_PLO } from "../services/googleSheets.js";

const router = express.Router();

/* ================= ADMIN AUTH ================= */
function adminOnly(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    if (data.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }
    req.user = data;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ============================================
   PROGRAMME PLO DASHBOARD (ADMIN)
   SOURCE: ASSESSMENT_PLO
===============================================*/
router.get("/programme-plo", adminOnly, async (req, res) => {
  try {
    const { programme } = req.query;
    if (!programme) {
      return res.status(400).json({ error: "Missing programme" });
    }

    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    // 🔥 IMPORTANT: Programme comes from ASSESSMENT_PLO sheet
    const filtered = rows.filter(
      r => (r.programme || "").trim() === programme.trim()
    );

    if (filtered.length === 0) {
      return res.json({ programmes: {} });
    }

    const ploKeys = Array.from({ length: 11 }, (_, i) => `plo${i + 1}`);

    const agg = {};
    ploKeys.forEach(p => {
      agg[p.toUpperCase()] = { total: 0, count: 0 };
    });

    filtered.forEach(r => {
      ploKeys.forEach(p => {
        const v = Number(r[p]);
        if (!isNaN(v)) {
          agg[p.toUpperCase()].total += v;
          agg[p.toUpperCase()].count += 1;
        }
      });
    });

    const result = {};
    Object.entries(agg).forEach(([p, o]) => {
      const avg = o.count ? +(o.total / o.count).toFixed(2) : 0;
      result[p] = {
        average: avg,
        status: avg >= 3 ? "Achieved" : "At Risk",
      };
    });

    res.json({
      programmes: {
        [programme]: result,
      },
    });
  } catch (err) {
    console.error("PROGRAMME PLO ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
