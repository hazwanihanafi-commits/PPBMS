// backend/routes/supervisor.js
import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

// helpers: compute progress and status (same logic as student)
const MILESTONE_KEYS = [
  "P1 Submitted","P1 Approved",
  "P3 Submitted","P3 Approved",
  "P4 Submitted","P4 Approved",
  "P5 Submitted","P5 Approved"
];

function calculateProgress(row) {
  const completed = MILESTONE_KEYS.filter(k => row[k] && row[k] !== "" && row[k] !== "#N/A").length;
  const percentage = Math.round((completed / MILESTONE_KEYS.length) * 100);
  return percentage;
}

function getStatus(percentage) {
  if (percentage === 100) return "Completed";
  if (percentage >= 75) return "Ahead";
  if (percentage >= 50) return "On Track";
  if (percentage >= 25) return "Behind";
  return "At Risk";
}

// GET /api/supervisor/students?email=supervisor@usm.my
router.get("/students", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Missing supervisor email" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const filtered = rows.filter(
      r => (r["Main Supervisor's Email"] || "").toLowerCase() === email.toLowerCase()
    );

    const students = filtered.map(r => {
      const progress = calculateProgress(r);
      const status = getStatus(progress);
      const supervisorName = r["Main Supervisor Name"] || r["Main Supervisor's Email"] || "";

      return {
        id: r["Student's Email"] || r["Matric"] || r["Student Name"],
        name: r["Student Name"] || "—",
        programme: r["Programme"] || "—",
        supervisor: supervisorName,
        progress,
        status,
        raw: r // include raw row if frontend needs more fields
      };
    });

    res.json({ students });
  } catch (err) {
    console.error("Supervisor route error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/supervisor/student/:email  -> single student data
router.get("/student/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email || "");
    if (!email) return res.status(400).json({ error: "Missing student email param" });

    const rows = await readMasterTracking(process.env.SHEET_ID);
    const row = rows.find(r => (r["Student's Email"] || "").toLowerCase() === email.toLowerCase());

    if (!row) return res.status(404).json({ error: "Student not found" });

    const progress = calculateProgress(row);
    const status = getStatus(progress);

    const student = {
      id: row["Student's Email"],
      name: row["Student Name"],
      programme: row["Programme"],
      supervisor: row["Main Supervisor Name"] || row["Main Supervisor's Email"],
      progress,
      status,
      raw: row
    };

    res.json({ student });
  } catch (err) {
    console.error("Supervisor student route error:", err);
    res.status(500).json({ error: err.message });
  }
});

// debug endpoint to see header keys
router.get("/debug-keys", async (req, res) => {
  try {
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const keys = Object.keys(rows[0] || {});
    res.json({ keys });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
