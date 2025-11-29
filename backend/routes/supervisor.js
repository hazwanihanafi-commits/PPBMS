// backend/routes/supervisor.js
import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

// 12 activities used for progress calculation
const ACTIVITIES = [
  // submission columns and other activity keys from your sheet
  "P1 Submitted",
  "P3 Submitted",
  "P4 Submitted",
  "P5 Submitted",
  "Thesis Draft Completed",
  "Ethical clearance obtained",
  "Pilot or Phase 1 completed",
  "Progress approved",
  "Seminar & report submitted",
  "Phase 2 completed",
  "1 indexed paper submitted",
  "Conference presentation"
];

function calculateProgressFromRow(row) {
  // count activities where the sheet cell is not empty
  const completed = ACTIVITIES.filter((k) => row[k] && row[k].toString().trim() !== "").length;
  const percent = Math.round((completed / ACTIVITIES.length) * 100);
  return { percent, completed, total: ACTIVITIES.length };
}

function statusFromPercent(pct) {
  if (pct === 100) return "Completed";
  if (pct >= 75) return "Ahead";
  if (pct >= 50) return "On Track";
  if (pct >= 25) return "Behind";
  return "At Risk";
}

router.get("/students", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Missing supervisor email" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const supervised = rows.filter(
      (r) => (r["Main Supervisor's Email"] || "").toString().toLowerCase() === email.toLowerCase()
    );

    const students = supervised.map((r) => {
      const { percent, completed } = calculateProgressFromRow(r);
      return {
        id: r["Student's Email"] || r["Matric"] || r["Student Name"],
        name: r["Student Name"] || "—",
        programme: r["Programme"] || "—",
        supervisorName: r["Main Supervisor"] || r["Main Supervisor's Name"] || r["Main Supervisor's Email"] || "—",
        progress: percent,
        completed,
        total: ACTIVITIES.length,
        status: statusFromPercent(percent)
      };
    });

    res.json({ students });
  } catch (err) {
    console.error("supervisor students err:", err);
    res.status(500).json({ error: err.message || "server error" });
  }
});

export default router;
