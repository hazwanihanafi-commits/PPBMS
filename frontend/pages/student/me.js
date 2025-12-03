import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking } from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";

const router = express.Router();

// AUTH MIDDLEWARE
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Helper: normalize email columns
function getRowEmail(row) {
  return (
    row["Student's Email"] ||
    row["Student Email"] ||
    row["Email"] ||
    row["email"] ||
    ""
  )
    .toLowerCase()
    .trim();
}

/* -------------------------------------------------------
   GET /api/student/me
------------------------------------------------------- */
router.get("/me", auth, async (req, res) => {
  try {
    const loginEmail = (req.user.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find((r) => getRowEmail(r) === loginEmail);

    if (!raw) {
      console.log("LOGIN EMAIL NOT FOUND:", loginEmail);
      return res.status(404).json({ error: "Student not found" });
    }

    // Build profile
    const profile = {
      student_id:
        raw["Matric"] ||
        raw["Matric No"] ||
        raw["Student ID"] ||
        raw["StudentID"] ||
        "",

      student_name: raw["Student Name"] || "",
      email: getRowEmail(raw),
      programme: raw["Programme"] || "",
      supervisor: raw["Main Supervisor"] || "",
      start_date: raw["Start Date"] || "",
      department: raw["Department"] || "-",
      field: raw["Field"] || "-",
      raw,
    };

    const timeline = buildTimelineForRow(raw);

    return res.json({ row: { ...profile, timeline } });
  } catch (err) {
    console.error("student/me error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
