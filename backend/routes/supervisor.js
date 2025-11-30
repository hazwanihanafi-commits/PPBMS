// backend/routes/supervisor.js
import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

function calculateProgressFromPlan(row, programme) {
  // reuse same logic as frontend for consistency; simple version:
  const lower = (programme || "").toLowerCase();
  const isMsc = lower.includes("msc") || lower.includes("master");
  const plan = isMsc
    ? [
      "Development Plan & Learning Contract","Proposal Defense Endorsed","Pilot / Phase 1 Completed","Phase 2 Data Collection Begun",
      "Annual Progress Review (Year 1)","Phase 2 Data Collection Continued","Seminar Completed","Thesis Draft Completed",
      "Internal Evaluation Completed","Viva Voce","Corrections Completed","Final Thesis Submission"
    ]
    : [
      "Development Plan & Learning Contract","Proposal Defense Endorsed","Pilot / Phase 1 Completed","Annual Progress Review (Year 1)",
      "Phase 2 Completed","Seminar Completed","Data Analysis Completed","1 Journal Paper Submitted","Conference Presentation",
      "Annual Progress Review (Year 2)","Thesis Draft Completed","Internal Evaluation Completed","Viva Voce","Corrections Completed","Final Thesis Submission"
    ];

  const done = plan.filter(k => {
    const v = row[k];
    if (!v) return false;
    const s = String(v).trim().toLowerCase();
    if (!s) return false;
    if (["", "n/a", "na", "#n/a", "-", "—"].includes(s)) return false;
    return true;
  }).length;

  const percentage = plan.length ? Math.round((done / plan.length) * 100) : 0;
  return { done, total: plan.length, percentage };
}

// list students supervised by ?email
router.get("/students", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Missing supervisor email" });

    const rows = await readMasterTracking(process.env.SHEET_ID);
    const filtered = rows.filter(r => {
      // your sheet has "Main Supervisor" (name) and "Main Supervisor's Email"
      const supEmail = (r["Main Supervisor's Email"] || "").toLowerCase();
      const mainSup = (r["Main Supervisor"] || "").toLowerCase();
      return supEmail === email.toLowerCase() || mainSup.includes(email.toLowerCase());
    });

    const students = filtered.map(r => {
      const progCalc = calculateProgressFromPlan(r, r["Programme"] || "");
      return {
        id: r["Student's Email"],
        name: r["Student Name"],
        programme: r["Programme"],
        supervisor: r["Main Supervisor"] || r["Main Supervisor's Name"] || r["Main Supervisor's Email"],
        progress: progCalc.percentage,
        status: progCalc.percentage === 100 ? "Completed" : (progCalc.percentage >= 75 ? "Ahead" : (progCalc.percentage >= 50 ? "On Track" : (progCalc.percentage >= 25 ? "Behind" : "At Risk"))),
        raw: r
      };
    });

    return res.json({ students });
  } catch (err) {
    console.error("supervisor/students error", err);
    return res.status(500).json({ error: err.message });
  }
});

// single student detail (by email)
router.get("/student/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const found = rows.find(r => (r["Student's Email"] || "").toLowerCase() === email.toLowerCase());
    if (!found) return res.status(404).json({ error: "Student not found" });
    const prog = calculateProgressFromPlan(found, found["Programme"] || "");
    return res.json({ student: { id: found["Student's Email"], name: found["Student Name"], programme: found["Programme"], supervisor: found["Main Supervisor"], progress: prog.percentage, raw: found }});
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
