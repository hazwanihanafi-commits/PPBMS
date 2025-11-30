// backend/routes/supervisor.js
import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

// ===== 1. Same MSc / PhD plan (no P1–P5 labels) =====

const MSC_PLAN = [
  { key: "Development Plan & Learning Contract", optional: false },
  { key: "Master Research Timeline (Gantt)", optional: true },
  { key: "Research Logbook (Weekly)", optional: true },
  { key: "Proposal Defense Endorsed", optional: false },
  { key: "Pilot / Phase 1 Completed", optional: false },
  { key: "Phase 2 Data Collection Begun", optional: false },
  { key: "Annual Progress Review (Year 1)", optional: false },
  { key: "Phase 2 Data Collection Continued", optional: false },
  { key: "Seminar Completed", optional: false },
  { key: "Thesis Draft Completed", optional: false },
  { key: "Internal Evaluation Completed", optional: false }, // evidence stage
  { key: "Viva Voce", optional: false },
  { key: "Corrections Completed", optional: false },
  { key: "Final Thesis Submission", optional: false },       // evidence stage
];

const PHD_PLAN = [
  { key: "Development Plan & Learning Contract", optional: false },
  { key: "Master Research Timeline (Gantt)", optional: true },
  { key: "Research Logbook (Weekly)", optional: true },
  { key: "Proposal Defense Endorsed", optional: false },
  { key: "Pilot / Phase 1 Completed", optional: false },
  { key: "Annual Progress Review (Year 1)", optional: false },
  { key: "Phase 2 Completed", optional: false },
  { key: "Seminar Completed", optional: false },
  { key: "Data Analysis Completed", optional: false },
  { key: "1 Journal Paper Submitted", optional: false },
  { key: "Conference Presentation", optional: false },
  { key: "Annual Progress Review (Year 2)", optional: false },
  { key: "Thesis Draft Completed", optional: false },
  { key: "Internal Evaluation Completed", optional: false }, // evidence stage
  { key: "Viva Voce", optional: false },
  { key: "Corrections Completed", optional: false },
  { key: "Final Thesis Submission", optional: false },       // evidence stage
];

function inferProgrammeTypeBack(row) {
  const p = (row["Programme"] || "").toLowerCase();
  if (p.includes("master") || p.includes("msc")) return "msc";
  return "phd";
}

function isTickedBack(row, key) {
  const v = row?.[key];
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  if (!s || ["", "n/a", "na", "#n/a", "-", "—"].includes(s)) return false;
  return true;
}

function calculateProgressFromPlanBack(row) {
  const type = inferProgrammeTypeBack(row);
  const plan = type === "msc" ? MSC_PLAN : PHD_PLAN;
  const required = plan.filter((i) => !i.optional);
  const doneRequired = required.filter((i) => isTickedBack(row, i.key)).length;
  const totalRequired = required.length || 1;
  const percentage = Math.round((doneRequired / totalRequired) * 100);
  return { percentage };
}

function statusFromPercentage(p) {
  if (p === 100) return "Completed";
  if (p >= 75) return "Ahead";
  if (p >= 50) return "On Track";
  if (p >= 25) return "Behind";
  return "At Risk";
}

// =============================
// GET /api/supervisor/students
// =============================
router.get("/students", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ error: "Missing supervisor email" });
    }

    const rows = await readMasterTracking(process.env.SHEET_ID);

    // Use MAIN SUPERVISOR NAME, but filter by email if you prefer
    const filtered = rows.filter(
      (r) =>
        (r["Main Supervisor's Email"] || "").toLowerCase() ===
        email.toLowerCase()
    );

    const students = filtered.map((r) => {
      const prog = calculateProgressFromPlanBack(r);
      return {
        id: r["Student's Email"],
        name: r["Student Name"],
        programme: r["Programme"],
        supervisor: r["Main Supervisor"], // <-- full name
        progress: prog.percentage,
        status: statusFromPercentage(prog.percentage),
      };
    });

    return res.json({ students });
  } catch (err) {
    console.error("Supervisor fetch error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
