import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

// ------ Helper to calculate progress (SAME as student/me) ------
function calculateProgress(row) {
  const milestones = [
    "P1 Submitted",
    "P1 Approved",
    "P3 Submitted",
    "P3 Approved",
    "P4 Submitted",
    "P4 Approved",
    "P5 Submitted",
    "P5 Approved"
  ];

  const completed = milestones.filter(m => row[m] && row[m] !== "").length;
  const percentage = Math.round((completed / milestones.length) * 100);

  return percentage;
}

function getStatus(percentage) {
  if (percentage === 100) return "Completed";
  if (percentage >= 75) return "Ahead";
  if (percentage >= 50) return "On Track";
  if (percentage >= 25) return "Behind";
  return "At Risk";
}

// ------ SUPERVISOR STUDENT LIST ------
router.get("/students", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Missing supervisor email" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const filtered = rows.filter(
      r => r["Main Supervisor's Email"]?.toLowerCase() === email.toLowerCase()
    );

    const result = filtered.map(r => {
      const progress = calculateProgress(r);
      const status = getStatus(progress);

      return {
        id: r["Student's Email"],
        name: r["Student Name"],
        programme: r["Programme"],
        progress,
        status
      };
    });

    res.json({ students: result });

  } catch (err) {
    console.error("Supervisor fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
