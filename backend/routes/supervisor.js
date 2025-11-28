import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// AUTH MIDDLEWARE
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Get ALL supervised students
router.get("/students", auth, async (req, res) => {
  try {
    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const supervised = rows
      .filter(r => (r["Main Supervisor's Email"] || "").toLowerCase() === email)
      .map(r => ({
        student_name: r["Student Name"],
        programme: r["Programme"],
        email: r["Student's Email"],
        supervisor: r["Main Supervisor's Email"],
        status: r["Status P"],
        raw: r
      }));

    return res.json({ students: supervised });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get ONE student by email
router.get("/student/:email", auth, async (req, res) => {
  try {
    const target = req.params.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const match = rows.find(
      r => (r["Student's Email"] || "").toLowerCase() === target
    );

    if (!match) return res.status(404).json({ error: "Student not found" });

    return res.json({ row: match });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
