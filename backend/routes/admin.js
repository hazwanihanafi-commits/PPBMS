import express from "express";
import jwt from "jsonwebtoken";

import { readASSESSMENT_PLO } from "../services/googleSheets.js";
import { readMasterTracking } from "../services/googleSheets.js";

import { computeProgrammeCQI } from "../utils/programmeCQIFromFinalPLO.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";

const router = express.Router();

/* =========================
   ADMIN AUTH
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
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* =================================================
   GET PROGRAMMES (ADMIN DROPDOWN)
================================================= */
router.get("/programmes", adminAuth, async (req, res) => {
  try {
    const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);

    const programmes = [
      ...new Set(
        rows
          .map(r => String(r.programme || "").trim())
          .filter(Boolean)
      ),
    ].sort();

    res.json({ programmes });
  } catch (e) {
    console.error("programmes error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* =================================================
   PROGRAMME CQI (FINAL, MQA-COMPLIANT)
   → derived ONLY from FINAL PLO per student
================================================= */
router.get("/programme-plo", adminAuth, async (req, res) => {
  try {
    const programme = String(req.query.programme || "").trim();
    if (!programme) {
      return res.status(400).json({ error: "Programme required" });
    }

    const data = await computeProgrammeCQI(
      programme,
      process.env.SHEET_ID
    );

    res.json(data);
  } catch (e) {
    console.error("programme CQI error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* =================================================
   ADMIN STUDENT LIST
   (SAME LOGIC AS SUPERVISOR DASHBOARD)
================================================= */
router.get("/students", adminAuth, async (req, res) => {
  try {
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const students = rows.map(r => {
      const timeline = buildTimelineForRow(r);
      const completed = timeline.filter(
        t => t.status === "Completed"
      ).length;

      return {
        id: r["Matric"] || "",
        name: r["Student Name"] || "",
        email: (r["Student's Email"] || "").toLowerCase().trim(),
        programme: r["Programme"] || "",
        field: r["Field"] || "",
        status: r["Status"] || "Active",
        progressPercent: timeline.length
          ? Math.round((completed / timeline.length) * 100)
          : 0,
      };
    });

    res.json({ students });
  } catch (e) {
    console.error("admin students error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
