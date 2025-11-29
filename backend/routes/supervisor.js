// backend/routes/supervisor.js
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
    const v = row?.[a];
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

function getStatus(percentage) {
  if (percentage === 100) return "Completed";
  if (percentage >= 75) return "Ahead";
  if (percentage >= 50) return "On Track";
  if (percentage >= 25) return "Behind";
  return "At Risk";
}

router.get("/students", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Missing supervisor email" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const supervised = rows.filter(r => {
      const supEmail = (r["Main Supervisor's Email"] || r["Main Supervisor Email"] || "").toString().trim();
      return supEmail.toLowerCase() === email.toLowerCase();
    });

    const result = supervised.map(r => {
      const calc = calculateProgressFrom12(r);
      const status = getStatus(calc.percentage);

      return {
        id: r["Student's Email"] || r["Email"] || r.email || r["Student Email"] || "",
        name: r["Student Name"] || r["Name"] || r.student_name || "",
        programme: r["Programme"] || r.programme || "",
        progress: calc.percentage,
        done: calc.done,
        total: calc.total,
        status,
        mainSupervisor: r["Main Supervisor"] || r["Main Supervisor's Name"] || r["Main Supervisor Name"] || r["Main Supervisor's Email"] || ""
      };
    });

    res.json({ students: result });
  } catch (err) {
    console.error("Supervisor route error:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
