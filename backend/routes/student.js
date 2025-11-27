import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

/* ---------------------------------------------
   AUTH MIDDLEWARE
----------------------------------------------*/
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains email + name
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ---------------------------------------------
   GET STUDENT DASHBOARD DATA
----------------------------------------------*/
// backend/routes/student.js

router.get("/me", auth, async (req, res) => {
  try {
    const email = (req.user.email || "").toLowerCase().trim();

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find(
      (r) =>
        ((r["Student's Email"] || "").toLowerCase().trim() === email)
    );

    if (!raw) {
      return res.status(404).json({ error: "Student not found in sheet" });
    }

    // Normalize for frontend
    const row = {
      student_name: raw["Student's Name"] || "",
      email: raw["Student's Email"] || "",
      programme: raw["Programme"] || "",
      supervisor: raw["Supervisor"] || "",
      start_date: raw["Start Date"] || "",
      raw,  // keep the original object for milestones
    };

    return res.json({ row });

  } catch (err) {
    console.error("GET /student/me ERROR:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});


export default router;
