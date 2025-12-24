// backend/routes/student.js
import express from "express";
import jwt from "jsonwebtoken";
import {
  readMasterTracking,
  writeSheetCell
} from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { resetSheetCache } from "../utils/sheetCache.js";

const router = express.Router();

/* =========================
   AUTH MIDDLEWARE
========================= */
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

/* =========================
   GET PROFILE + TIMELINE
========================= */
router.get("/me", auth, async (req, res) => {
  try {
    const email = req.user.email.toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) return res.status(404).json({ error: "Student not found" });

    const profile = {
      student_name: raw["Student Name"] || "",
      email: raw["Student's Email"] || "",
      matric: raw["Matric"] || "",
      programme: raw["Programme"] || "",
      supervisor: raw["Main Supervisor"] || "",
      cosupervisors: raw["Co-Supervisor(s)"] || "",
      start_date: raw["Start Date"] || "",
      department: raw["Department"] || "-",
      field: raw["Field"] || "-"
    };

    const timeline = buildTimelineForRow(raw);

    return res.json({
      row: {
        ...profile,
        timeline
      }
    });

  } catch (e) {
    console.error("student/me error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/* =========================
   MARK COMPLETED
========================= */
router.post("/update-actual", auth, async (req, res) => {
  try {
    const { activity, date } = req.body;
    if (!activity || !date) {
      return res.status(400).json({ error: "Missing data" });
    }

    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );

    if (idx === -1) {
      return res.status(404).json({ error: "Student not found" });
    }

    await writeSheetCell(
      process.env.SHEET_ID,
      `${activity} - Actual`,
      idx + 2,
      date
    );

    resetSheetCache();
    res.json({ success: true });

  } catch (e) {
    console.error("update-actual error:", e);
    res.status(500).json({ error: "Update failed" });
  }
});

/* =========================
   RESET COMPLETED (NEW)
========================= */
router.post("/reset-actual", auth, async (req, res) => {
  try {
    const { activity } = req.body;
    if (!activity) {
      return res.status(400).json({ error: "Missing activity" });
    }

    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );

    if (idx === -1) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Clear actual date
    await writeSheetCell(
      process.env.SHEET_ID,
      `${activity} - Actual`,
      idx + 2,
      ""
    );

    resetSheetCache();
    res.json({ success: true });

  } catch (e) {
    console.error("reset-actual error:", e);
    res.status(500).json({ error: "Reset failed" });
  }
});

export default router;
