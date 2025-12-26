import express from "express";
import jwt from "jsonwebtoken";
import {
  readASSESSMENT_PLO
} from "../services/googleSheets.js";

const router = express.Router();

/* =========================
   ADMIN AUTH
========================= */
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* =========================
   GET ALL PROGRAMMES
   (FOR DROPDOWN)
========================= */
router.get("/programmes", auth, async (req, res) => {
  try {
    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    const programmes = [
      ...new Set(
        rows
          .map(r => (r["Programme"] || "").trim())
          .filter(Boolean)
      ),
    ].sort();

    return res.json({ programmes });
  } catch (err) {
    console.error("Programme list error:", err);
    return res.status(500).json({ error: "Failed to load programmes" });
  }
});

/* =========================
   PROGRAMME CQI
========================= */
router.get("/programme-plo", auth, async (req, res) => {
  try {
    const programme = (req.query.programme || "").trim();
    if (!programme) {
      return res.status(400).json({ error: "Programme required" });
    }

    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    const filtered = rows.filter(r =>
      (r["Programme"] || "").trim() === programme &&
      String(r["Status"] || "").toLowerCase() === "graduated"
    );

    const ploStats = {};
    for (let i = 1; i <= 11; i++) {
      ploStats[`PLO${i}`] = { assessed: 0, achieved: 0 };
    }

    filtered.forEach(r => {
      for (let i = 1; i <= 11; i++) {
        const v = Number(r[`PLO${i}`]);
        if (!isNaN(v)) {
          ploStats[`PLO${i}`].assessed++;
          if (v >= 3) ploStats[`PLO${i}`].achieved++;
        }
      }
    });

    const result = {};
    Object.entries(ploStats).forEach(([plo, d]) => {
      const percent =
        d.assessed > 0 ? (d.achieved / d.assessed) * 100 : null;

      result[plo] = {
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
            : "CQI Required",
      };
    });

    res.json({ programme, plo: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
