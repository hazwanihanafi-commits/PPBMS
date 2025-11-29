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

  let done = 0;

  for (const a of activities) {
    const v = row?.[a];
    if (!v) continue;
    const s = String(v).trim().toLowerCase();
    if (s && !["", "n/a", "#n/a", "-", "—"].includes(s)) done++;
  }

  return {
    done,
    total: activities.length,
    percentage: Math.round((done / activities.length) * 100)
  };
}

router.get("/students", async (req, res) => {
  try {
    const supervisorEmail = req.query.email;
    if (!supervisorEmail)
      return res.status(400).json({ error: "Missing supervisor email" });

    // load sheet
    const rows = await readMasterTracking(process.env.SHEET_ID);

    // FIXED: Correct column to match email
    const matches = rows.filter(
      r => (r["Main Supervisor's Email"] || "").toLowerCase() === supervisorEmail.toLowerCase()
    );

    const students = matches.map(r => {
      const prog = calculateProgressFrom12(r);

      return {
        id: r["Student's Email"],
        name: r["Student Name"],
        programme: r["Programme"],
        supervisor: r["Main Supervisor"],    // <-- NAME instead of email
        progress: prog.percentage,
        status:
          prog.percentage === 100 ? "Completed"
          : prog.percentage >= 75 ? "Ahead"
          : prog.percentage >= 50 ? "On Track"
          : prog.percentage >= 25 ? "Behind"
          : "At Risk"
      };
    });

    return res.json({ students });

  } catch (err) {
    console.error("Supervisor fetch error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
