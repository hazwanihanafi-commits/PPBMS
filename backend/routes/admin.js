import express from "express";
import jwt from "jsonwebtoken";

import {
  readASSESSMENT_PLO
} from "../services/googleSheets.js";

const router = express.Router();

/* =========================================================
   AUTH (ADMIN ONLY)
========================================================= */
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* =========================================================
   GET /api/admin/programme-plo
   ✅ MQA-COMPLIANT PROGRAMME CQI
========================================================= */
router.get("/programme-plo", auth, async (req, res) => {
  try {
    const programme = (req.query.programme || "").trim();
    if (!programme) {
      return res.status(400).json({ error: "Programme is required" });
    }

    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    /* ---------------------------------------------
       1️⃣ FILTER: PROGRAMME + GRADUATED ONLY
    --------------------------------------------- */
    const filtered = rows.filter(r =>
      (r.programme || "").trim() === programme &&
      String(r.status || "").toLowerCase() === "graduated"
    );

    /* ---------------------------------------------
       2️⃣ AGGREGATE PER PLO
    --------------------------------------------- */
    const ploStats = {};

    for (let i = 1; i <= 11; i++) {
      ploStats[`PLO${i}`] = {
        assessed: 0,
        achieved: 0
      };
    }

    filtered.forEach(r => {
      for (let i = 1; i <= 11; i++) {
        const score = Number(r[`plo${i}`]);
        if (!isNaN(score)) {
          ploStats[`PLO${i}`].assessed += 1;
          if (score >= 3) {
            ploStats[`PLO${i}`].achieved += 1;
          }
        }
      }
    });

    /* ---------------------------------------------
       3️⃣ FORMAT RESPONSE (70% RULE)
    --------------------------------------------- */
    const programmeResult = {};

    Object.entries(ploStats).forEach(([plo, d]) => {
      const percent =
        d.assessed > 0 ? (d.achieved / d.assessed) * 100 : null;

      programmeResult[plo] = {
        assessed: d.assessed,
        achieved: d.achieved,
        percent: percent !== null ? Number(percent.toFixed(1)) : null,
        status:
          d.assessed === 0
            ? "Not Assessed"
            : percent >= 70
            ? "Achieved"
            : percent >= 50
            ? "Borderline"
            : "CQI Required"
      };
    });

    res.json({
      programmes: {
        [programme]: programmeResult
      }
    });

  } catch (e) {
    console.error("Programme PLO error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* =====================================================
   GET ALL PROGRAMMES (ADMIN ONLY)
===================================================== */
router.get(
  "/programmes",
  authMiddleware("admin"),
  async (req, res) => {
    try {
      const rows = await readMasterTracking(process.env.SHEET_ID);

      const programmes = [
        ...new Set(
          rows
            .map(r => r["Programme"])
            .filter(Boolean)
        ),
      ].sort();

      return res.json({ programmes });
    } catch (err) {
      console.error("PROGRAMME LIST ERROR:", err);
      return res.status(500).json({ error: "Failed to load programmes" });
    }
  }
);

export default router;
