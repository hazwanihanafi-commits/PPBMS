// backend/routes/supervisor.js
import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";
import { calculateProgressFrom12 } from "../utils/calcProgressServer.js"; // optional server-side util if you have one

const router = express.Router();

function getStatusFromPercent(pct) {
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
    // BEFORE (wrong)
const filtered = rows.filter(
  r => r["Main Supervisor's Email"]?.toLowerCase() === email.toLowerCase()
);

// AFTER (correct)
const filtered = rows.filter(r =>
  r["Main Supervisor"]?.toLowerCase().includes(email.toLowerCase())
  || r["Main Supervisor's Email"]?.toLowerCase() === email.toLowerCase()
);


    const students = filtered.map(r => {
      const raw = r;
      // simple progress calculation server-side using the same 12 activities
      const activities = [
        "P1 Submitted","P3 Submitted","P4 Submitted","P5 Submitted",
        "Thesis Draft Completed","Ethical clearance obtained","Pilot or Phase 1 completed",
        "Progress approved","Seminar & report submitted","Phase 2 completed",
        "1 indexed paper submitted","Conference presentation"
      ];
      const done = activities.filter(a => {
        const v = raw[a];
        if (!v) return false;
        const s = String(v).trim().toLowerCase();
        if (!s) return false;
        if (["", "n/a", "na", "#n/a", "-", "—"].includes(s)) return false;
        return true;
      }).length;
      const pct = Math.round((done / activities.length) * 100);
      return {
        id: r["Student's Email"] || r["Student Email"] || r["Matric"] || r["Student ID"],
        name: r["Student Name"] || r["Name"] || "",
        programme: r["Programme"] || "",
        progress: pct,
        status: getStatusFromPercent(pct)
      };
    });

    res.json({ students });
  } catch (err) {
    console.error("supervisor route error", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
