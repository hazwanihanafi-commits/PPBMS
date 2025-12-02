import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet } from "../utils/sheetCache.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";

const router = express.Router();

// ---------------- AUTH ----------------
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

// -------- Extract supervisor email from row --------
function getSupervisorEmail(row) {
  return (
    row["Main Supervisor's Email"] ||
    row["Main Supervisor Email"] ||
    row["Supervisor Email"] ||
    row["Main Supervisor"] ||
    ""
  )
    .toString()
    .toLowerCase()
    .trim();
}

/*-------------------------------------------------------
  GET /api/supervisor/students
-------------------------------------------------------*/
router.get("/students", auth, async (req, res) => {
  try {
    const supervisorEmail = (req.user.email || "").toLowerCase().trim();
    const rows = await getCachedSheet(process.env.SHEET_ID);

    const assigned = rows.filter(
      (r) => getSupervisorEmail(r) === supervisorEmail
    );

    const result = [];

    for (const r of assigned) {
      const timeline = buildTimelineForRow(r);

      const completed = timeline.filter((t) => t.status === "Completed").length;
      const total = timeline.length;
      const progress_percent =
        total === 0 ? 0 : Math.round((completed / total) * 100);

      const field =
        r["Field"] ||
        r["Field of Study"] ||
        r["Research Field"] ||
        r["Research Area"] ||
        "-";

      const department =
        r["Department"] ||
        r["Department Name"] ||
        r["Dept"] ||
        r["Main Department"] ||
        "-";

      result.push({
        student_name: r["Student Name"] || r["Name"] || "",
        email: r["Student's Email"] || "",
        programme: r["Programme"] || "",
        field,
        department,
        start_date: r["Start Date"] || "",
        progress_percent,
        completed,
        total,
        timeline,
      });
    }

    return res.json({ students: result });
  } catch (err) {
    console.error("supervisor/students", err);
    return res.status(500).json({ error: err.message });
  }
});

/*-------------------------------------------------------
  GET /api/supervisor/student/:email
-------------------------------------------------------*/
router.get("/student/:email", auth, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email)
      .toLowerCase()
      .trim();

    const rows = await getCachedSheet(process.env.SHEET_ID);

    const raw = rows.find(
      (r) =>
        (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw) {
      return res.status(404).json({ error: "Student not found" });
    }

    const profile = {
      student_name: raw["Student Name"] || "",
      email: raw["Student's Email"] || "",
      programme: raw["Programme"] || "",
      field: raw["Field"] || "-",
      department: raw["Department"] || "-",
      start_date: raw["Start Date"] || "",
    };

    const timeline = buildTimelineForRow(raw);
    const completed = timeline.filter((t) => t.status === "Completed").length;
    const total = timeline.length;

    return res.json({
      student: {
        ...profile,
        progress: Math.round((completed / total) * 100),
        completed,
        total,
      },
      timeline,
    });
  } catch (err) {
    console.error("GET /student/:email", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
