import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

function calculateProgressFrom12(row) {
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
    if (!v) return false;
    const s = String(v).trim().toLowerCase();
    if (!s) return false;
    if (["", "n/a", "na", "#n/a", "-", "—"].includes(s)) return false;
    return true;
  }).length;

  return {
    done,
    total: activities.length,
    percentage: Math.round((done / activities.length) * 100)
  };
}

// GET supervisee list
router.get("/students", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Missing supervisor email" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const filtered = rows.filter(r => {
  const supEmail = (r["Main Supervisor's Email"] || "").toLowerCase();
  const supName  = (r["Main Supervisor"] || "").toLowerCase();
  const query    = email.toLowerCase();
  return

    const result = filtered.map(r => {
      const prog = calculateProgressFrom12(r);
      return {
        id: r["Student's Email"],
        name: r["Student Name"],
        programme: r["Programme"],
        progress: prog.percentage,
        status:
          prog.percentage === 100 ? "Completed" :
          prog.percentage >= 75 ? "Ahead" :
          prog.percentage >= 50 ? "On Track" :
          prog.percentage >= 25 ? "Behind" :
          "At Risk"
      };
    });

    res.json({ students: result });

  } catch (err) {
    console.error("Supervisor fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
