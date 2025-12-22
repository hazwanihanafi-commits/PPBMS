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

    const filtered = rows.filter(
      r => (r.programme || "").trim() === programme.trim()
    );

    const ploKeys = Array.from({ length: 11 }, (_, i) => `plo${i + 1}`);

    /* ===============================
       GROUP BY STUDENT
    =============================== */
    const byStudent = {};

    filtered.forEach(r => {
      const sid = r.matric || r.studentemail;
      if (!sid) return;

      if (!byStudent[sid]) {
        byStudent[sid] = {};
        ploKeys.forEach(p => (byStudent[sid][p] = []));
      }

      ploKeys.forEach(p => {
        const v = Number(r[p]);
        if (!isNaN(v)) byStudent[sid][p].push(v);
      });
    });

    /* ===============================
       STUDENT-LEVEL STATUS
    =============================== */
    const ploStats = {};
    ploKeys.forEach(p => {
      ploStats[p.toUpperCase()] = { achieved: 0, total: 0 };
    });

    Object.values(byStudent).forEach(student => {
      ploKeys.forEach(p => {
        if (student[p].length === 0) return;

        const avg =
          student[p].reduce((a, b) => a + b, 0) /
          student[p].length;

        ploStats[p.toUpperCase()].total += 1;

        if (avg >= 3.0) {
          ploStats[p.toUpperCase()].achieved += 1;
        }
      });
    });

    /* ===============================
       PROGRAMME INDICATOR
    =============================== */
    const result = {};

    Object.entries(ploStats).forEach(([plo, s]) => {
      const percent = s.total
        ? +((s.achieved / s.total) * 100).toFixed(2)
        : 0;

      result[plo] = {
        achievedStudents: s.achieved,
        totalStudents: s.total,
        attainmentPercent: percent,
        status: percent >= 70 ? "Achieved" : "CQI Required"
      };
    });

    res.json({
      programmes: {
        [programme]: result
      }
    });

  } catch (err) {
    console.error("PROGRAMME PLO ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
