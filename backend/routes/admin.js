import express from "express";
import jwt from "jsonwebtoken";
import { readASSESSMENT_PLO, readMasterTracking } from "../services/googleSheets.js";
import { computeProgrammeCQI } from "../utils/computeProgrammeCQI.js";

const router = express.Router();


function adminAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}


/* Programmes */
router.get("/programmes", adminAuth, async (req, res) => {
  const rows = await readASSESSMENT_PLO(process.env.SHEET_ID);
  const programmes = [...new Set(rows.map(r => r.programme).filter(Boolean))];
  res.json({ programmes });
});

router.get("/programme-plo", adminAuth, async (req, res) => {
  try {
    const { programme } = req.query;
    if (!programme) {
      return res.status(400).json({ error: "Programme required" });
    }

    const data = await computeProgrammeCQI(
      programme,
      process.env.SHEET_ID
    );

    res.json(data);
  } catch (err) {
    console.error("❌ Programme CQI error:", err);
    res.status(500).json({
      error: "Failed to compute programme CQI",
      detail: err.message
    });
  }
});

router.get("/programme-students", adminAuth, async (req, res) => {
  try {
    const { programme } = req.query;
    if (!programme) {
      return res.status(400).json({ error: "Programme required" });
    }

    if (!process.env.SHEET_ID) {
      throw new Error("SHEET_ID is not defined");
    }

    const rows = await readMasterTracking(process.env.SHEET_ID);

    if (!Array.isArray(rows)) {
      throw new Error("MasterTracking did not return an array");
    }

    const students = rows.filter(r =>
      String(r["Programme"] || "").trim() ===
      String(programme).trim()
    );

    res.json({
      count: students.length,
      students
    });
  } catch (err) {
    console.error("❌ Programme students error:", err);
    res.status(500).json({
      error: "Failed to load programme students",
      detail: err.message
    });
  }
});

export default router;
