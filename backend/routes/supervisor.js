// backend/routes/supervisor.js
import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

/* -----------------------------------------------------
   PROGRESS CALCULATION (matches your Google Sheet)
----------------------------------------------------- */
function calculateProgressFromPlan(row, programme) {
  const lower = (programme || "").toLowerCase();
  const isMsc = lower.includes("msc") || lower.includes("master");

  const MSC_PLAN = [
    "Development Plan & Learning Contract",
    "Proposal Defense Endorsed",
    "Pilot / Phase 1 Completed",
    "Phase 2 Data Collection Begun",
    "Annual Progress Review (Year 1)",
    "Phase 2 Data Collection Continued",
    "Seminar Completed",
    "Annual Progress Review (Year 2)",
    "Thesis Draft Completed",
    "Final Progress Review (Year 3)",
    "Viva Voce",
    "Corrections Completed",
    "Final Thesis Submission"
  ];

  const PHD_PLAN = [
    "Development Plan & Learning Contract",
    "Proposal Defense Endorsed",
    "Pilot / Phase 1 Completed",
    "Annual Progress Review (Year 1)",
    "Phase 2 Completed",
    "Seminar Completed",
    "Data Analysis Completed",
    "1 Journal Paper Submitted",
    "Conference Presentation",
    "Annual Progress Review (Year 2)",
    "Thesis Draft Completed",
    "Final Progress Review (Year 3)",
    "Viva Voce",
    "Corrections Completed",
    "Final Thesis Submission"
  ];

  const plan = isMsc ? MSC_PLAN : PHD_PLAN;

  const done = plan.filter((key) => {
    const v = row[key];
    if (!v) return false;
    const s = String(v).trim().toLowerCase();
    if (["", "n/a", "na", "-", "#n/a", "—"].includes(s)) return false;
    return true;
  }).length;

  const percentage = Math.round((done / plan.length) * 100);

  return { done, total: plan.length, percentage };
}

/* -----------------------------------------------------
   LIST ALL STUDENTS UNDER A SUPERVISOR
----------------------------------------------------- */
router.get("/students", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Missing supervisor email" });

    const rows = await readMasterTracking(process.env.SHEET_ID);
    const filtered = rows.filter(r => {
      const supEmail = (r["Main Supervisor's Email"] || "").toLowerCase();
      const supName = (r["Main Supervisor"] || "").toLowerCase();
      return supEmail === email.toLowerCase() || supName.includes(email.toLowerCase());
    });

    const students = filtered.map(r => {
      const prog = calculateProgressFromPlan(r, r["Programme"] || "");
      return {
        id: r["Student's Email"],
        name: r["Student Name"],
        programme: r["Programme"],
        supervisor: r["Main Supervisor"],
        progress: prog.percentage,
        status:
          prog.percentage === 100
            ? "Completed"
            : prog.percentage >= 75
              ? "Ahead"
              : prog.percentage >= 50
                ? "On Track"
                : prog.percentage >= 25
                  ? "Behind"
                  : "At Risk",
        raw: r
      };
    });

    res.json({ students });
  } catch (err) {
    console.error("supervisor/students error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -----------------------------------------------------
   SINGLE STUDENT DETAIL
----------------------------------------------------- */
router.get("/student/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const found = rows.find(
      r => (r["Student's Email"] || "").toLowerCase() === email.toLowerCase()
    );

    if (!found) return res.status(404).json({ error: "Student not found" });

    const prog = calculateProgressFromPlan(found, found["Programme"] || "");

    res.json({
      student: {
        id: found["Student's Email"],
        name: found["Student Name"],
        programme: found["Programme"],
        supervisor: found["Main Supervisor"],
        progress: prog.percentage,
        raw: found
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
