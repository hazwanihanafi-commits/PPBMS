import express from "express";
import { getSheetRows } from "../services/googleSheets.js";

const router = express.Router();

router.get("/students", async (req, res) => {
  try {
    const email = req.query.email; // supervisor email
    if (!email) return res.status(400).json({ error: "Missing supervisor email" });

    const rows = await getSheetRows();

    // Filter only students supervised by the supervisor
    const supervised = rows.filter(
      (r) => r["Main Supervisor's Email"]?.toLowerCase() === email.toLowerCase()
    );

    // Build response
    const result = supervised.map((r) => {
      const completed = [
        r["P1 Submitted"],
        r["P3 Submitted"],
        r["P4 Submitted"],
        r["P5 Submitted"]
      ].filter(Boolean).length;

      const percentage = Math.round((completed / 4) * 100);

      // Basic status logic
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

  } catch (e) {
    console.error("Supervisor fetch error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.get("/debug-keys", async (req, res) => {
  const rows = await getSheetRows();
  const keys = Object.keys(rows[0] || {});
  return res.json({ keys });
});


export default router;
