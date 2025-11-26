import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

router.get("/students", async (req, res) => {
  try {
    const rows = await readMasterTracking(process.env.SHEET_ID);

    res.json({
      count: rows.length,
      students: rows.map(r => ({
        matric: r["Matric"],
        name: r["Student Name"],
        programme: r["Programme"],
        supervisor: r["Main Supervisor's Email"],
        email: r["Student's Email"],
        status: r["Status P"],
      })),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
