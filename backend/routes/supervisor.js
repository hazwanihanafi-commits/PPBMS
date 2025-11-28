import express from "express";
import { getSheetRows } from "../services/googleSheets.js";

const router = express.Router();

/* -----------------------------------------------------------
   Helpers
----------------------------------------------------------- */

// Check submission and compute progress
function computeStudentProgress(row) {
  const tasks = [
    row["P1 Submitted"],
    row["P3 Submitted"],
    row["P4 Submitted"],
    row["P5 Submitted"]
  ];

  const completed = tasks.filter(v => v && v !== "#N/A").length;
  const percent = Math.round((completed / 4) * 100);

  return {
    completed,
    percent
  };
}

// Compute status
function determineStatus(percent) {
  if (percent >= 90) return "Ahead";
  if (percent >= 70) return "On Track";
  if (percent >= 40) return "At Risk";
  return "Behind";
}

/* -----------------------------------------------------------
   GET ALL STUDENTS FOR SUPERVISOR
----------------------------------------------------------- */
router.get("/:supervisorEmail", async (req, res) => {
  try {
    const email = req.params.supervisorEmail.toLowerCase();
    const rows = await getSheetRows();

    const filtered = rows.filter(r =>
      r["Supervisor"] &&
      r["Supervisor"].toLowerCase().includes(email)
    );

    const response = filtered.map(r => {
      const p = computeStudentProgress(r);
      return {
        student_name: r["Student Name"],
        programme: r["Programme"],
        supervisor: r["Supervisor"],
        email: r["Email"],
        department: r["Department"],
        field: r["Field"],
        start_date: r["Start Date"],
        progress: p.percent,
        status: determineStatus(p.percent)
      };
    });

    res.json({ students: response });

  } catch (err) {
    console.error("Supervisor fetch error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* -----------------------------------------------------------
   GET SINGLE STUDENT DETAILS
   (For /supervisor/[id])
----------------------------------------------------------- */
router.get("/student/:studentEmail", async (req, res) => {
  try {
    const email = req.params.studentEmail.toLowerCase();
    const rows = await getSheetRows();

    const student = rows.find(
      r => r["Email"] && r["Email"].toLowerCase() === email
    );

    if (!student) return res.status(404).json({ error: "Student not found" });

    const progress = computeStudentProgress(student);
    const status = determineStatus(progress.percent);

    res.json({
      student: {
        name: student["Student Name"],
        programme: student["Programme"],
        supervisor: student["Supervisor"],
        email: student["Email"],
        field: student["Field"],
        department: student["Department"],
        start_date: student["Start Date"],

        progress: progress.percent,
        status,
        raw: student
      }
    });

  } catch (err) {
    console.error("Student detail error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
