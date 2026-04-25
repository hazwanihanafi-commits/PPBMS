// ===============================
// backend/routes/admin.js
// ===============================

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

  const token = (req.headers.authorization || "")
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

/* ================= STATUS DERIVER ================= */
function deriveOverallStatus(timeline) {

  if (!Array.isArray(timeline) || timeline.length === 0) {
    return "NO_DATA";
  }

  const statuses = timeline.map(t =>
    String(t.status || "")
      .toUpperCase()
      .trim()
  );

  if (statuses.every(s => s === "COMPLETED")) {
    return "GRADUATED";
  }

  if (statuses.some(s => s === "AT_RISK")) {
    return "AT_RISK";
  }

  if (statuses.some(s => s === "SLIGHTLY_DELAYED")) {
    return "SLIGHTLY_DELAYED";
  }

  return "ON_TRACK";
}

/* ================= PROGRAMMES ================= */
router.get("/programmes", adminAuth, async (req, res) => {

  const rows = await readFINALPROGRAMPLO(
    process.env.SHEET_ID
  );

  const programmes = [
    ...new Set(
      rows
        .map(r => String(r.Programme || "").trim())
        .filter(Boolean)
    )
  ];

  res.json({ programmes });
});

/* ================= PROGRAMME PLO ================= */
router.get("/programme-plo", adminAuth, async (req, res) => {

  const { programme } = req.query;

  if (!programme) {
    return res.status(400).json({
      error: "Programme required"
    });
  }

  const data = await computeProgrammeCQI(
    programme,
    process.env.SHEET_ID
  );

  res.json(data);
});

/* ================= GRADUATED STUDENTS ================= */
router.get("/programme-graduates", adminAuth, async (req, res) => {

  const { programme } = req.query;

  const rows = await readMasterTracking(
    process.env.SHEET_ID
  );

  const students = rows.filter(r =>

    String(r.Programme || "").trim() === programme.trim() &&

    String(r.Status || "").trim() === "Graduated"
  );

  res.json({
    count: students.length,

    students: students.map(r => ({
      matric: r.Matric || "",
      name: r["Student Name"] || "",
      email: (
        r["Student's Email"] || ""
      ).toLowerCase(),

      status: "GRADUATED"
    }))
  });
});

/* ================= ACTIVE STUDENTS ================= */
router.get(
  "/programme-active-students",
  adminAuth,
  async (req, res) => {

    const { programme } = req.query;

    const rows = await readMasterTracking(
      process.env.SHEET_ID
    );

    const students = rows

      .filter(r =>

        String(r.Programme || "").trim() ===
          programme.trim() &&

        String(r.Status || "").trim() ===
          "Active"
      )

      .map(r => {

        const timeline = buildTimelineForRow(r);

        return {
          matric: r.Matric || "",
          name: r["Student Name"] || "",
          email: (
            r["Student's Email"] || ""
          ).toLowerCase(),

          status: deriveOverallStatus(timeline)
        };
      });

    res.json({
      count: students.length,
      students
    });
  }
);

/* ================= PROGRAMME SUMMARY ================= */
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

    const rows = await readMasterTracking(
      process.env.SHEET_ID
    );

    let onTrack = 0;
    let slightlyDelayed = 0;
    let atRisk = 0;
    let graduated = 0;

    rows

      .filter(r =>
        String(r.Programme || "").trim() ===
        programme.trim()
      )

      .forEach(r => {

        if (
          String(r.Status || "").trim() ===
          "Graduated"
        ) {
          graduated++;
          return;
        }

        const timeline = buildTimelineForRow(r);

        const statuses = timeline.map(t =>
          String(t.status || "")
            .toUpperCase()
            .trim()
        );

        if (statuses.some(s => s === "AT_RISK")) {

          atRisk++;

        } else if (
          statuses.some(
            s => s === "SLIGHTLY_DELAYED"
          )
        ) {

          slightlyDelayed++;

        } else {

          onTrack++;
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

/* ================= SINGLE STUDENT ================= */
router.get(
  "/admin/student/:email",
  adminAuth,
  async (req, res) => {

    try {

      const email = req.params.email
        .toLowerCase()
        .trim();

      const rows = await readMasterTracking(
        process.env.SHEET_ID
      );

      const raw = rows.find(

        r => (
          r["Student's Email"] || ""
        )
          .toLowerCase()
          .trim() === email
      );

      if (!raw) {
        return res.status(404).json({
          error: "Student not found"
        });
      }

      const profile = {

        student_id:
          raw["Matric"] ||
          raw["Matric No"] ||
          "",

        name:
          raw["Student Name"] || "",

        email:
          raw["Student's Email"] || "",

        programme:
          raw["Programme"] || "",

        field:
          raw["Field"] || "",

        department:
          raw["Department"] || "",

        status:
          raw["Status"] || "",

        mainSupervisor:
          raw["Main Supervisor"] || "",

        coSupervisors:
          raw["Co-Supervisor(s)"]

            ? raw["Co-Supervisor(s)"]
                .split(",")
                .map(s => s.trim())
                .filter(Boolean)

            : []
      };

      const timeline =
        buildTimelineForRow(raw);

      res.json({
        row: {
          ...profile,
          timeline
        }
      });

    } catch (err) {

      console.error(
        "Admin get student error:",
        err
      );

      res.status(500).json({
        error: "Failed to load student"
      });
    }
  }
);

/* ================= PROGRAMMES ================= */
router.get(
  "/programmes/students",
  adminAuth,
  async (req, res) => {

    const rows = await readMasterTracking(
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
