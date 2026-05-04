import express from "express";
import jwt from "jsonwebtoken";

import {
  readMasterTracking,
  readFINALPROGRAMPLO
} from "../services/googleSheets.js";

import {
  buildTimelineForRow
} from "../utils/buildTimeline.js";

import {
  computeProgrammeCQI
} from "../utils/computeProgrammeCQI.js";

const router = express.Router();

/* ==========================================
   AUTH
========================================== */
function adminAuth(req, res, next) {

  const token =
    (req.headers.authorization || "")
      .replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      error: "No token"
    });
  }

  try {
    const user = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (user.role !== "admin") {
      return res.status(403).json({
        error: "Forbidden"
      });
    }

    req.user = user;
    next();

  } catch {
    return res.status(401).json({
      error: "Invalid token"
    });
  }
}

/* ==========================================
   GET PROGRAMMES
========================================== */
router.get(
  "/programmes",
  adminAuth,
  async (req, res) => {

    const rows =
      await readFINALPROGRAMPLO(
        process.env.SHEET_ID
      );

    const programmes = [
      ...new Set(
        rows
          .map(r =>
            String(r.Programme || "").trim()
          )
          .filter(Boolean)
      )
    ];

    res.json({ programmes });
  }
);

/* ==========================================
   PROGRAMME PLO
========================================== */
router.get(
  "/programme-plo",
  adminAuth,
  async (req, res) => {

    const { programme } = req.query;

    if (!programme) {
      return res.status(400).json({
        error: "Programme required"
      });
    }

    const data =
      await computeProgrammeCQI(
        programme,
        process.env.SHEET_ID
      );

    res.json(data);
  }
);

/* ==========================================
   GRADUATED STUDENTS
========================================== */
router.get(
  "/programme-graduates",
  adminAuth,
  async (req, res) => {

    const { programme } = req.query;

    const rows =
      await readMasterTracking(
        process.env.SHEET_ID
      );

    const students = rows
      .filter(r =>
        String(r.Programme || "").trim() === programme.trim() &&
        String(r.Status || "").trim() === "Graduated"
      )
      .map(r => ({

        matric: r.Matric || "",
        name: r["Student Name"] || "",
        email: (r["Student's Email"] || "").toLowerCase(),

        status: "Graduated",
        progressPercent: 100
      }));

    res.json({
      count: students.length,
      students
    });
  }
);

/* ==========================================
   ACTIVE STUDENTS (FINAL FIX)
========================================== */
router.get(
  "/programme-active-students",
  adminAuth,
  async (req, res) => {

    const { programme } = req.query;

    const rows =
      await readMasterTracking(
        process.env.SHEET_ID
      );

    const students = rows
      .filter(r =>
        String(r.Programme || "").trim() === programme.trim() &&
        String(r.Status || "").trim() === "Active"
      )
      .map(r => {

        const timeline =
          buildTimelineForRow(r);

        const completed =
          timeline.filter(
            t =>
              String(t.status || "")
                .toUpperCase()
                .trim() === "COMPLETED"
          ).length;

        const progressPercent =
          timeline.length
            ? Math.round(
                (completed / timeline.length) * 100
              )
            : 0;

        let category = "At Risk";

        if (progressPercent >= 80) {
          category = "On Track";
        } else if (progressPercent >= 50) {
          category = "Slightly Late";
        }

        return {
          matric: r.Matric || "",
          name: r["Student Name"] || "",
          email: (r["Student's Email"] || "").toLowerCase(),

          status: category,
          progressPercent
        };
      });

    res.json({
      count: students.length,
      students
    });
  }
);

/* ==========================================
   PROGRAMME SUMMARY (FIXED)
========================================== */
router.get(
  "/programme-summary",
  adminAuth,
  async (req, res) => {

    const { programme } = req.query;

    if (!programme) {
      return res.status(400).json({
        error: "Programme required"
      });
    }

    const rows =
      await readMasterTracking(
        process.env.SHEET_ID
      );

    let onTrack = 0;
    let slightlyDelayed = 0;
    let atRisk = 0;
    let graduated = 0;

    rows
      .filter(r =>
        String(r.Programme || "").trim() === programme.trim()
      )
      .forEach(r => {

        if (
          String(r.Status || "").trim() === "Graduated"
        ) {
          graduated++;
          return;
        }

        const timeline =
          buildTimelineForRow(r);

        const completed =
          timeline.filter(
            t =>
              String(t.status || "")
                .toUpperCase()
                .trim() === "COMPLETED"
          ).length;

        const progressPercent =
          timeline.length
            ? Math.round(
                (completed / timeline.length) * 100
              )
            : 0;

        if (progressPercent >= 80) {
          onTrack++;
        } else if (progressPercent >= 50) {
          slightlyDelayed++;
        } else {
          atRisk++;
        }
      });

    res.json({
      onTrack,
      slightlyDelayed,
      atRisk,
      graduated
    });
  }
);

/* ==========================================
   SINGLE STUDENT
========================================== */
/* ==========================================
   SINGLE STUDENT (FINAL FIX - ROBUST)
========================================== */
router.get(
  "/student/:email",
  adminAuth,
  async (req, res) => {

    try {

      const paramEmail =
        String(req.params.email || "")
          .toLowerCase()
          .trim();

      const rows =
        await readMasterTracking(
          process.env.SHEET_ID
        );

      const raw = rows.find(r => {

        const sheetEmail =
          String(r["Student's Email"] || "")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ""); // 🔥 REMOVE HIDDEN SPACES

        const cleanParam =
          paramEmail.replace(/\s+/g, "");

        return sheetEmail === cleanParam;
      });

      if (!raw) {
        console.log("❌ NOT FOUND:", paramEmail);

        return res.status(404).json({
          error: "Student not found"
        });
      }

      /* =========================
         TIMELINE + PROGRESS
      ========================= */
      const timeline =
        buildTimelineForRow(raw);

      const completed =
        timeline.filter(
          t =>
            String(t.status || "")
              .toUpperCase()
              .trim() === "COMPLETED"
        ).length;

      const progressPercent =
        timeline.length
          ? Math.round(
              (completed / timeline.length) * 100
            )
          : 0;

      let category = "At Risk";

      if (progressPercent >= 80) {
        category = "On Track";
      } else if (progressPercent >= 50) {
        category = "Slightly Late";
      }

      /* =========================
         RESPONSE
      ========================= */
      res.json({
        row: {
          student_id:
            raw["Matric"] || "",
          name:
            raw["Student Name"] || "",
          email:
            String(raw["Student's Email"] || "").trim(),

          programme:
            raw["Programme"] || "",
          field:
            raw["Field"] || "",
          department:
            raw["Department"] || "",

          status: category,
          progressPercent,
          timeline
        }
      });

    } catch (err) {

      console.error("❌ STUDENT ERROR:", err);

      res.status(500).json({
        error: "Failed to load student"
      });
    }
  }
);
/* ==========================================
   ALL PROGRAMMES
========================================== */
router.get(
  "/programmes/students",
  adminAuth,
  async (req, res) => {

    const rows =
      await readMasterTracking(
        process.env.SHEET_ID
      );

    const programmes = [
      ...new Set(
        rows
          .map(r =>
            String(r.Programme || "").trim()
          )
          .filter(Boolean)
      )
    ];

    res.json({ programmes });
  }
);

export default router;
