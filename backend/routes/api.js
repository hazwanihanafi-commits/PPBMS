import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";
import studentRouter from "./student.js";   // ✅ ADD THIS

const router = express.Router();

// -------------------------
// PUBLIC STATUS LOOKUP
// -------------------------
router.get("/status", async (req, res) => {
  try {
    const matric = (req.query.matric || "").trim();
    if (!matric) return res.json({ error: "Missing matric" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const student = rows.find(
      (r) => String(r["Matric"]).trim() === matric
    );

    if (!student) return res.status(404).json({ error: "Student not found" });

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

// -------------------------
// ADD YOUR STUDENT ROUTES
// -------------------------
router.use("/student", studentRouter);   // ✅ THIS FIXES /api/student/me

export default router;
