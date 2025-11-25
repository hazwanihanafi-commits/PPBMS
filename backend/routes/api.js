import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

router.get("/status", async (req, res) => {
  try {
    const matric = (req.query.matric || "").trim();
    if (!matric) return res.json({ error: "Missing matric" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const student = rows.find(
      (r) => String(r["Matric"]).trim() === matric
    );

    if (!student) return res.status(404).json({ error: "Student not found" });

    // Return essential info
    res.json({
      matric: student["Matric"],
      name: student["Student Name"],
      programme: student["Programme"],
      P1: student["P1 Submitted"] || "",
      P3: student["P3 Submitted"] || "",
      P4: student["P4 Submitted"] || "",
      P5: student["P5 Submitted"] || "",
      overall: student["Status P"] || "",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
