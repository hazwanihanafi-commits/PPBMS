import express from "express";
import jwt from "jsonwebtoken";

import {
  readMasterTracking,
  readFINALPROGRAMPLO
} from "../services/googleSheets.js";

import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { computeProgrammeCQI } from "../utils/computeProgrammeCQI.js";

const router = express.Router();

/* ================= AUTH ================= */
function adminAuth(req, res, next) {

  const token =
    (req.headers.authorization || "")
      .replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.user = user;
    next();

  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ================= PROGRAMMES ================= */
router.get("/programmes/students", adminAuth, async (req, res) => {

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const programmes = [
    ...new Set(
      rows.map(r => String(r.Programme || "").trim()).filter(Boolean)
    )
  ];

  res.json({ programmes });
});

/* ================= ACTIVE STUDENTS ================= */
router.get("/programme-active-students", adminAuth, async (req, res) => {

  const { programme } = req.query;

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const students = rows
    .filter(r =>
      String(r.Programme || "").trim() === programme.trim() &&
      String(r.Status || "").trim() === "Active"
    )
    .map(r => {

      const timeline = buildTimelineForRow(r);

      const completed =
        timeline.filter(t =>
          String(t.status || "").toUpperCase() === "COMPLETED"
        ).length;

      const progressPercent =
        timeline.length
          ? Math.round((completed / timeline.length) * 100)
          : 0;

      let status = "At Risk";

      if (progressPercent >= 80) status = "On Track";
      else if (progressPercent >= 50) status = "Slightly Late";

      return {
        matric: r.Matric || "",
        name: r["Student Name"] || "",
        email: String(r["Student's Email"] || "").trim().toLowerCase(),
        status,
        progressPercent
      };
    });

  res.json({ students });
});

/* ================= GRADUATES ================= */
router.get("/programme-graduates", adminAuth, async (req, res) => {

  const { programme } = req.query;

  const rows = await readMasterTracking(process.env.SHEET_ID);

  const students = rows
    .filter(r =>
      String(r.Programme || "").trim() === programme.trim() &&
      String(r.Status || "").trim() === "Graduated"
    )
    .map(r => ({
      matric: r.Matric || "",
      name: r["Student Name"] || "",
      email: String(r["Student's Email"] || "").trim().toLowerCase(),
      status: "Graduated",
      progressPercent: 100
    }));

  res.json({ students });
});

/* ================= SUMMARY ================= */
router.get("/programme-summary", adminAuth, async (req, res) => {

  const { programme } = req.query;

  const rows = await readMasterTracking(process.env.SHEET_ID);

  let onTrack = 0, slightlyDelayed = 0, atRisk = 0, graduated = 0;

  rows
    .filter(r => String(r.Programme || "").trim() === programme.trim())
    .forEach(r => {

      if (String(r.Status || "").trim() === "Graduated") {
        graduated++;
        return;
      }

      const timeline = buildTimelineForRow(r);

      const completed =
        timeline.filter(t =>
          String(t.status || "").toUpperCase() === "COMPLETED"
        ).length;

      const progress =
        timeline.length
          ? Math.round((completed / timeline.length) * 100)
          : 0;

      if (progress >= 80) onTrack++;
      else if (progress >= 50) slightlyDelayed++;
      else atRisk++;
    });

  res.json({ onTrack, slightlyDelayed, atRisk, graduated });
});

/* ================= SINGLE STUDENT ================= */
/* ==========================================
   ADMIN GET STUDENT (USE SUPERVISOR LOGIC)
========================================== */
router.get(
  "/student/:email",
  adminAuth,
  async (req, res) => {

    try {

      const email =
        req.params.email
          .toLowerCase()
          .trim();

      /* 🔥 FAKE SUPERVISOR CONTEXT */
      const fakeReq = {
        ...req,
        params: { email },
        user: {
          role: "admin", // allow access
          email: req.user.email
        }
      };

      /* 🔥 REUSE SUPERVISOR CONTROLLER */
      return router.handle(
        fakeReq,
        res,
        () => {}
      );

    } catch (err) {

      console.error("ADMIN STUDENT ERROR:", err);

      res.status(500).json({
        error: "Failed to load student"
      });
    }
  }
);

export default router;
