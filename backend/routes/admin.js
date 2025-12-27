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

/* Programme CQI */
router.get("/programme-plo", adminAuth, async (req, res) => {
  const data = await computeProgrammeCQI(
    req.query.programme,
    process.env.SHEET_ID
  );
  res.json(data);
});

/* Programme students */
router.get("/programme-students", adminAuth, async (req, res) => {
  const rows = await readMasterTracking(process.env.SHEET_ID);
  const students = rows.filter(
    r => r["Programme"] === req.query.programme
  );
  res.json({ students });
});

export default router;
