import express from "express";
import jwt from "jsonwebtoken";
import { readASSESSMENT_PLO } from "../services/googleSheets.js";

const router = express.Router();

/* =========================
   ADMIN AUTH MIDDLEWARE
========================= */
function adminAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* =================================================
   GET PROGRAMME LIST (FOR DROPDOWN)
================================================= */
router.get("/programmes", adminAuth, async (req, res) => {
  try {
    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    if (!rows.length) {
      return res.json({ programmes: [] });
    }

    const programmes = [
      ...new Set(
        rows
          .map(r => {
            const key = Object.keys(r).find(
              k => k.trim().toLowerCase() === "programme"
            );
            return key ? String(r[key]).trim() : "";
          })
          .filter(Boolean)
      )
    ].sort();

    console.log("ADMIN PROGRAMMES:", programmes);

    res.json({ programmes });
  } catch (e) {
    console.error("PROGRAMME LIST ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});
/* =================================================
   PROGRAMME CQI (ONE ROUTE ONLY)
================================================= */
router.get("/programme-plo", adminAuth, async (req, res) => {
  try {
    const programme = (req.query.programme || "").trim();
    if (!programme) {
      return res.status(400).json({ error: "Programme required" });
    }

    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    // ✅ SHEET HEADERS CONFIRMED
    const filtered = rows.filter(r =>
      String(r["Programme"] || "").trim() === programme &&
      String(r["Status"] || "").toLowerCase() === "graduated"
    );

    const ploStats = {};
    for (let i = 1; i <= 11; i++) {
      ploStats[`PLO${i}`] = { assessed: 0, achieved: 0 };
    }

    filtered.forEach(r => {
      for (let i = 1; i <= 11; i++) {
        const score = Number(r[`PLO${i}`]);
        if (!isNaN(score)) {
          ploStats[`PLO${i}`].assessed++;
          if (score >= 3) ploStats[`PLO${i}`].achieved++;
        }
      }
    });

    const plo = {};
    Object.entries(ploStats).forEach(([key, d]) => {
      const percent =
        d.assessed > 0 ? (d.achieved / d.assessed) * 100 : null;

      plo[key] = {
        assessed: d.assessed,
        achieved: d.achieved,
        percent: percent ? Number(percent.toFixed(1)) : null,
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

    res.json({ programme, plo });

  } catch (e) {
    console.error("PROGRAMME CQI ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
