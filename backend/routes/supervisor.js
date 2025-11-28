import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

/* ---------------------------
   AUTH MIDDLEWARE
----------------------------*/
function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });

    req.user = jwt.verify(token, process.env.JWT_SECRET); // contains email + name
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ---------------------------
   GET ALL STUDENTS UNDER SUPERVISOR
----------------------------*/
router.get("/dashboard", auth, async (req, res) => {
  try {
    const email = req.user.email.toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    // Students under this supervisor
    const list = rows
      .filter((r) => (r["Main Supervisor's Email"] || "").toLowerCase().trim() === email)
      .map((r) => {
        const completed = [
          r["P1 Submitted"],
          r["P3 Submitted"],
          r["P4 Submitted"],
          r["P5 Submitted"],
        ].filter(Boolean).length;

        const progress = Math.round((completed / 4) * 100);

        let category = "Behind";
        if (progress === 100) category = "Ahead";
        else if (progress >= 50) category = "On Track";
        else if (progress >= 25) category = "At Risk";

        return {
          student_name: r["Student's Name"],
          email: r["Student's Email"],
          supervisor: r["Main Supervisor's Email"],
          programme: r["Programme"],
          progress,
          category,
          raw: r,
        };
      });

    return res.json({ students: list });
  } catch (err) {
    console.error("SUPERVISOR DASHBOARD ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ---------------------------
   GET SPECIFIC STUDENT DETAILS
----------------------------*/
router.get("/student/:email", auth, async (req, res) => {
  try {
    const target = req.params.email.toLowerCase().trim();
    const supEmail = req.user.email.toLowerCase().trim();

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const row = rows.find(
      (r) =>
        (r["Student's Email"] || "").toLowerCase().trim() === target &&
        (r["Main Supervisor's Email"] || "").toLowerCase().trim() === supEmail
    );

    if (!row) return res.status(404).json({ error: "Student not found or not under your supervision" });

    return res.json({
      row: {
        student_name: row["Student's Name"],
        email: row["Student's Email"],
        programme: row["Programme"],
        supervisor: row["Main Supervisor's Email"],
        start_date: row["Start Date"],
        field: row["Field"],
        department: row["Department"],
        raw: row,
      },
    });
  } catch (err) {
    console.error("SUPERVISOR STUDENT ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
