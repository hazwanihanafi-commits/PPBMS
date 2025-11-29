// backend/routes/supervisor.js
import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

// 🔧 helper
function calculateProgress(row) {
  const activities = [
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

  const done = activities.filter(a => {
    const v = row[a];
    return v && String(v).trim() !== "" && !["n/a","-","—","#n/a","na"].includes(String(v).trim().toLowerCase());
  }).length;

  return Math.round((done / activities.length) * 100);
}

function getStatus(p) {
  if (p === 100) return "Completed";
  if (p >= 75) return "Ahead";
  if (p >= 50) return "On Track";
  if (p >= 25) return "Behind";
  return "At Risk";
}

// -----------------------------------------------------
// GET STUDENTS UNDER THIS SUPERVISOR
// -----------------------------------------------------
router.get("/students", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Missing supervisor email" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    // IMPORTANT: match by Main Supervisor EMAIL column
    // You already have this column in Google Sheet
    const filtered = rows.filter(r =>
      r["Main Supervisor Email"]?.toLowerCase() === email.toLowerCase()
    );

    // Build result
    const result = filtered.map(r => {
      const progress = calculateProgress(r);

      return {
        id: r["Student's Email"],
        name: r["Student Name"],
        programme: r["Programme"],
        supervisorName: r["Main Supervisor"],     // ← FULL NAME
        supervisorEmail: r["Main Supervisor Email"],
        progress,
        status: getStatus(progress)
      };
    });

    res.json({ students: result });

  } catch (err) {
    console.error("Supervisor fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
