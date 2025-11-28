import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

/* Helpers */
function calcProgress(r) {
  const submitted = [
    r["P1 Submitted"],
    r["P3 Submitted"],
    r["P4 Submitted"],
    r["P5 Submitted"],
  ].filter(x => x && x !== "#N/A");

  return Math.round((submitted.length / 4) * 100);
}

function statusFromProgress(p) {
  if (p >= 90) return "Ahead";
  if (p >= 70) return "On Track";
  if (p >= 40) return "At Risk";
  return "Behind";
}

/* GET all students under 1 supervisor */
router.get("/:supervisorEmail", async (req, res) => {
  try {
    const email = req.params.supervisorEmail.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const filtered = rows.filter(
      (r) =>
        (r["Main Supervisor's Email"] || "").toLowerCase() === email
    );

    const list = filtered.map((r) => {
      const p = calcProgress(r);
      return {
        student_name: r["Student Name"],
        email: r["Student's Email"],
        programme: r["Programme"],
        department: r["Department"],
        field: r["Field"],
        start_date: r["Start Date"],
        progress: p,
        status: statusFromProgress(p),
      };
    });

    res.json({ students: list });

  } catch (err) {
    console.error("Supervisor list error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
});

/* GET 1 student */
router.get("/student/:email", async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find(
      (r) => (r["Student's Email"] || "").toLowerCase() === email
    );

    if (!raw) return res.status(404).json({ error: "Student not found" });

    const p = calcProgress(raw);

    res.json({
      student: {
        name: raw["Student Name"],
        email: raw["Student's Email"],
        programme: raw["Programme"],
        department: raw["Department"],
        field: raw["Field"],
        supervisor: raw["Main Supervisor's Email"],
        start_date: raw["Start Date"],
        progress: p,
        status: statusFromProgress(p),
        raw,
      },
    });

  } catch (err) {
    console.error("Student detail error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
});

export default router;
