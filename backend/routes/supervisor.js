import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

// GET /api/supervisor/students?email=hazwanihanafi@usm.my
router.get("/students", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ error: "Missing supervisor email" });
    }

    // Load rows from MasterTracking sheet
    const rows = await readMasterTracking(process.env.SHEET_ID);

    if (!rows || rows.length === 0) {
      return res.json({ students: [] });
    }

    // Filter the supervisor’s students
    const supervised = rows.filter(
      (r) =>
        r["Main Supervisor's Email"]?.toLowerCase() === email.toLowerCase()
    );

    const result = supervised.map((r) => {
      const completed = [
        r["P1 Submitted"],
        r["P3 Submitted"],
        r["P4 Submitted"],
        r["P5 Submitted"]
      ].filter(Boolean).length;

      const percentage = Math.round((completed / 4) * 100);

      let status = "On Track";
      if (percentage === 100) status = "Completed";
      else if (percentage < 50) status = "At Risk";

      return {
        id: r["Student's Email"],
        name: r["Student Name"],
        programme: r["Programme"],
        supervisor: r["Main Supervisor's Email"],
        progress: percentage,
        status,
      };
    });

    res.json({ students: result });

  } catch (err) {
    console.error("Supervisor Route Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
