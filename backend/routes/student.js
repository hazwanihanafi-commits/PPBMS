// backend/routes/student.js
import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

router.get("/me", auth, async (req, res) => {
  try {
    const email = (req.user.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const row = rows.find(r => (r["Student's Email"] || "").toLowerCase().trim() === email);
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({
      row: {
        student_name: row["Student Name"] || "",
        email: row["Student's Email"] || email,
        programme: row["Programme"] || "",
        supervisor: row["Main Supervisor"] || row["Main Supervisor's Email"] || "",
        start_date: row["Start Date"] || "",
        raw: row,
      }
    });
  } catch (err) {
    console.error("student/me error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
