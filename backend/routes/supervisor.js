import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

/* ---------------------------------------------------
   Helper: calculate milestone progress
--------------------------------------------------- */
function calculateProgress(r) {
  const completed = [
    r["P1 Submitted"],
    r["P3 Submitted"],
    r["P4 Submitted"],
    r["P5 Submitted"],
  ].filter(Boolean).length;

  const percentage = Math.round((completed / 4) * 100);

  let status = "On Track";
  if (percentage === 100) status = "Completed";
  else if (percentage < 50) status = "At Risk";

  return { completed, percentage, status };
}

/* ---------------------------------------------------
   GET /api/supervisor/students
   → List of supervised students
--------------------------------------------------- */
router.get("/students", async (req, res) => {
  try {
    const email = req.query.email?.toLowerCase();
    if (!email) return res.status(400).json({ error: "Missing supervisor email" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const supervised = rows.filter(
      (r) => r["Main Supervisor's Email"]?.toLowerCase() === email
    );

    const students = supervised.map((r) => {
      const pg = calculateProgress(r);
      return {
        id: r["Student's Email"],
        name: r["Student Name"],
        programme: r["Programme"],
        progress: pg.percentage,
        status: pg.status,
      };
    });

    res.json({ students });
  } catch (e) {
    console.error("Supervisor/students ERROR:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------------------------------------------------
   GET /api/supervisor/student/:email
   → Full Student Detail (Supervisor View)
--------------------------------------------------- */
router.get("/student/:email", async (req, res) => {
  try {
    const email = req.params.email?.toLowerCase();
    if (!email) return res.status(400).json({ error: "Missing student email" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const r = rows.find(
      (row) => row["Student's Email"]?.toLowerCase() === email
    );

    if (!r) return res.status(404).json({ error: "Student not found" });

    const pg = calculateProgress(r);

    const student = {
      name: r["Student Name"],
      email: r["Student's Email"],
      programme: r["Programme"],
      field: r["Field"],
      department: r["Department"],
      supervisor: r["Main Supervisor's Email"],
      status: pg.status,
      progress: pg.percentage,
      raw: r,
    };

    res.json({ student });
  } catch (e) {
    console.error("Supervisor/student ERROR:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------------------------------------------------
   GET /api/supervisor/alerts
   → At-risk & delayed students
--------------------------------------------------- */
router.get("/alerts", async (req, res) => {
  try {
    const email = req.query.email?.toLowerCase();
    if (!email) return res.status(400).json({ error: "Missing supervisor email" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const supervised = rows.filter(
      (r) => r["Main Supervisor's Email"]?.toLowerCase() === email
    );

    const alerts = supervised.filter((r) => {
      const pg = calculateProgress(r);
      return pg.status === "At Risk";
    });

    res.json({ alerts });
  } catch (e) {
    console.error("Supervisor/alerts ERROR:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------------------------------------------------
   GET /api/supervisor/summary
   → Supervisor Analytics (counts, progress)
--------------------------------------------------- */
router.get("/summary", async (req, res) => {
  try {
    const email = req.query.email?.toLowerCase();
    if (!email) return res.status(400).json({ error: "Missing supervisor email" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const supervised = rows.filter(
      (r) => r["Main Supervisor's Email"]?.toLowerCase() === email
    );

    const total = supervised.length;

    const completed = supervised.filter(
      (r) => calculateProgress(r).percentage === 100
    ).length;

    const atRisk = supervised.filter(
      (r) => calculateProgress(r).status === "At Risk"
    ).length;

    const onTrack = supervised.filter(
      (r) => calculateProgress(r).status === "On Track"
    ).length;

    res.json({
      total,
      completed,
      atRisk,
      onTrack,
    });
  } catch (e) {
    console.error("Supervisor/summary ERROR:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
