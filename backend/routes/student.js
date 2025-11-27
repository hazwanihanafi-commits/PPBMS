// backend/routes/student.js
import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

/* ---------------------------------------------
   /api/student/me
   - Requires token containing matric number
--------------------------------------------- */

router.get("/me", async (req, res) => {
  try {
    // You stored matric inside token? Or user ID?
    // Example: req.user = { matric: "12345" }
    const matric = req.user?.matric;

    if (!matric) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const student = rows.find(
      (r) => String(r["Matric"]).trim() === String(matric).trim()
    );

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Normalize output for frontend
    const normalized = {
      student_id: student["Matric"],
      student_name: student["Student Name"],
      programme: student["Programme"],
      supervisor: student["Main Supervisor"],
      email: student["Student's Email"],
      start_date: student["Start Date"],

      raw: {
        "P1 Submitted": student["P1 Submitted"] || "",
        "P3 Submitted": student["P3 Submitted"] || "",
        "P4 Submitted": student["P4 Submitted"] || "",
        "P5 Submitted": student["P5 Submitted"] || "",
        "Status P": student["Status P"] || "",
      }
    };

    res.json({ row: normalized });

  } catch (err) {
    console.error("Error in /api/student/me:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
