import express from "express";
import jwt from "jsonwebtoken";
import { readASSESSMENT_PLO } from "../services/googleSheets.js";

const router = express.Router();

/* =========================
   ADMIN AUTH MIDDLEWARE
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

/* =========================================================
   GET ALL PROGRAMMES (FOR DROPDOWN)
========================================================= */
router.get("/programmes", auth, async (req, res) => {
  try {
    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    const programmes = [
      ...new Set(
        rows
          .map(r => String(r["Programme"] || "").trim())
          .filter(Boolean)
      ),
    ].sort();

    console.log("PROGRAMMES FOUND:", programmes);

    res.json({ programmes });
  } catch (err) {
    console.error("Programme list error:", err);
    res.status(500).json({ error: "Failed to load programmes" });
  }
});

/* =========================================================
   GET PROGRAMME CQI (PLO ATTAINMENT)
========================================================= */
router.get("/programme-plo", auth, async (req, res) => {
  try {
    const programme = (req.query.programme || "").trim();
    const includeActive = req.query.includeActive === "true";

    if (!programme) {
      return res.status(400).json({ error: "Programme required" });
    }

    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    // ✅ MATCHES YOUR SHEET EXACTLY
    const filtered = rows.filter(r =>
      String(r["Programme"] || "").trim() === programme &&
      (
        includeActive ||
        String(r["Status"] || "").toLowerCase() === "graduated"
      )
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

    const result = {};
    Object.entries(ploStats).forEach(([plo, d]) => {
      const percent =
        d.assessed > 0 ? (d.achieved / d.assessed) * 100 : null;

      result[plo] = {
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
            : "CQI Required",
      };
    });

    res.json({ programme, plo: result });

  } catch (e) {
    console.error("Programme CQI error:", e);
    res.status(500).json({ error: e.message });
  }
});
/* =========================================================
   GET STUDENT LIST BY PROGRAMME (ADMIN)
========================================================= */
router.get("/programme-students", auth, async (req, res) => {
  try {
    const programme = (req.query.programme || "").trim();
    if (!programme) {
      return res.status(400).json({ error: "Programme required" });
    }

    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    const students = rows
      .filter(r =>
        String(r["Programme"] || "").trim() === programme
      )
      .map(r => ({
        studentEmail: r["Student's Email"] || "",
        matric: r["Matric"] || "",
        supervisorEmail: r["Main Supervisor's Email"] || "",
        assessmentType: r["assessment_type"] || "",
        assessmentDate: r["Assessment_Date"] || "",
        status: r["Status"] || "",
      }));

    res.json({ programme, students });

  } catch (err) {
    console.error("Programme student list error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
