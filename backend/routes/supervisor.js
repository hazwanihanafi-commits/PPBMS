// backend/routes/supervisor.js
import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

// 12 activities as in your table
const ACTIVITIES = [
  "Registration & Orientation",
  "Literature Review & Proposal Preparation",
  "Proposal Defence",
  "Research Ethics Approval (JEPeM)",
  "Research Implementation I",
  "Mid-Candidature Review",
  "Research Communication I",
  "Research Implementation II",
  "Publication I",
  "Research Dissemination",
  "Thesis Preparation",
  "Pre-Submission Review (JPMPMP)"
];

function calculateProgress(row) {
  // We will look for canonical keys in the MasterTracking sheet that correspond to activity completion.
  // Attempt multiple possible column names for robustness:
  const matchKeys = [
    "Submission Document P1",
    "Submission Document P3",
    "Submission Document P4",
    "Submission Document P5",
    "Thesis Draft Completed",
    "Ethical clearance obtained",
    "Pilot or Phase 1 completed",
    "Progress approved",
    "Seminar & report submitted",
    "Phase 2 completed",
    "1 indexed paper submitted",
    "Conference presentation"
  ];

  let done = 0;
  matchKeys.forEach(k => {
    const v = row[k];
    if (v && String(v).trim() !== "" && !["n/a","#n/a","—","-"].includes(String(v).trim().toLowerCase())) {
      done += 1;
    }
  });

  const percentage = Math.round((done / matchKeys.length) * 100);
  return { percentage, done, total: matchKeys.length };
}

router.get("/students", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Missing supervisor email" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    // filter by Main Supervisor's Email OR Main Supervisor column (robust)
    const supervised = rows.filter(r => {
      const supEmail = (r["Main Supervisor's Email"] || "").toString().toLowerCase();
      const supName = (r["Main Supervisor"] || "").toString().toLowerCase();
      return supEmail === email.toLowerCase() || supName === email.toLowerCase();
    });

    const students = supervised.map(r => {
      const { percentage, done, total } = calculateProgress(r);

      return {
        id: r["Student's Email"] || r["Matric"] || r["Student ID"] || null,
        name: r["Student Name"] || r["Student's Name"] || "",
        programme: r["Programme"] || "",
        supervisorName: r["Main Supervisor"] || r["Main Supervisor's Name"] || r["Main Supervisor's Email"] || "",
        progress: percentage,
        completedCount: done,
        totalCount: total,
      };
    });

    res.json({ students });
  } catch (err) {
    console.error("Supervisor route error:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
