import express from "express";
import jwt from "jsonwebtoken";
import {
  readMasterTracking,
  writeSheetCell,
} from "../services/googleSheets.js";
import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { ACTUAL_COLUMN_MAP } from "../utils/timelineColumnMap.js";
import { TIMELINE_MAP } from "../utils/timelineMap.js";
import sendEmail
from "../services/sendEmail.js";
import { readASSESSMENT_PLO } from "../services/googleSheets.js";
import { deriveCQIByAssessment } from "../utils/cqiAggregate.js";
import { aggregateFinalPLO } from "../utils/finalPLOAggregate.js";

function normalizeActivity(activity) {
  if (ACTUAL_COLUMN_MAP[activity]) return activity;

  const entry = Object.entries(TIMELINE_MAP).find(
    ([_, cols]) =>
      cols.expected.startsWith(activity) ||
      cols.actual.startsWith(activity)
  );

  return entry ? entry[0] : null;
}

const router = express.Router();

/* ================= AUTH ================= */
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

/* ================= GET STUDENT ================= */
router.get("/me", auth, async (req, res) => {
  try {
    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );

    if (!raw) {
      return res.status(403).json({
        error: "Student record not found in Master Tracking. Please contact admin."
      });
    }

    const profile = {
      student_id: raw["Matric"] || "",
      student_name: raw["Student Name"] || "",
      email: raw["Student's Email"] || "",
      programme: raw["Programme"] || "",
      start_date: raw["Start Date"] || "",
      field: raw["Field"] || "",
      department: raw["Department"] || "",
      supervisor: raw["Main Supervisor"] || "",
      cosupervisors: raw["Co-Supervisor(s)"] || "",
    };

    const DOC_COLUMN_MAP = {
  "Development Plan & Learning Contract (DPLC)": "DPLC",
  "Student Supervision Logbook": "SUPERVISION_LOG",
  "Annual Progress Review – Year 1": "APR_Y1",
  "Annual Progress Review – Year 2": "APR_Y2",
  "Annual Progress Review – Year 3 (Final Year)": "APR_Y3",
  "Ethics Approval": "ETHICS_APPROVAL",
  "Publication Acceptance": "PUBLICATION_ACCEPTANCE",
  "Proof of Submission": "PROOF_OF_SUBMISSION",
  "Conference Presentation": "CONFERENCE_PRESENTATION",
  "Thesis Notice": "THESIS_NOTICE",
  "Viva Report": "VIVA_REPORT",
  "Correction Verification": "CORRECTION_VERIFICATION",
  "Final Thesis": "FINAL_THESIS",
};

const documents = {};

Object.entries(DOC_COLUMN_MAP).forEach(
  ([label, column]) => {

    documents[label] = {

      url:
        raw[column] || "",

      status:
        raw[`${column}_STATUS`] ||
        (
          raw[column]
            ? "Pending Review"
            : "Not Submitted"
        ),

      feedback:
        raw[`${column}_FEEDBACK`] || "",

      reviewed_by:
        raw[`${column}_REVIEWED_BY`] || "",

      reviewed_at:
        raw[`${column}_REVIEWED_AT`] || ""
    };
  }
);

    const timeline = buildTimelineForRow(raw);
    /* ================= CQI (SHARED WITH SUPERVISOR) ================= */

const assessmentRows =
  await readASSESSMENT_PLO(process.env.SHEET_ID);

const normalized =
  assessmentRows.map(r => {

    const clean = {};

    Object.keys(r).forEach(k => {
      clean[
        k.toLowerCase()
         .trim()
         .replace(/[^a-z0-9]+/g, "_")
      ] = r[k];
    });

    return clean;
  });

const matric =
  String(raw["Matric"] || "").trim();

const studentRows =
  normalized.filter(r => {

    const m =
      String(
        r["matric"] ||
        r["matricno"] ||
        ""
      ).trim();

    return m === matric;
  });

/* GROUP */
const grouped = {};

studentRows.forEach(r => {

  const instance =
    String(
      r["assessment_instance"] ||
      r["assessment_type"] ||
      ""
    ).toUpperCase();

  if (!grouped[instance]) {
    grouped[instance] = [];
  }

  grouped[instance].push(r);
});

/* CQI + REMARKS */
const cqiByAssessment = {};
const remarks = [];

Object.entries(grouped).forEach(([instance, rows]) => {

  const ploScores = rows.map(r => {

    const o = {};

    for (let i = 1; i <= 11; i++) {

      const rawValue = r[`plo${i}`];

      const v =
        rawValue === undefined ||
        rawValue === null ||
        rawValue === ""
          ? null
          : parseFloat(rawValue);

      o[`PLO${i}`] =
        isNaN(v) ? null : v;
    }

    return o;
  });

  cqiByAssessment[instance] =
    deriveCQIByAssessment(ploScores);

  rows.forEach(r => {

    const supervisorRemark =
      r.supervisor_remark || "";

    const studentResponse =
      r.student_response || "";

    let status = r.cqi_status;

    if (!status) {
      if (studentResponse) status = "RESPONDED";
      else if (supervisorRemark) status = "PENDING";
      else status = "NO_REMARK";
    }

    remarks.push({

      assessmentType:
        r.assessment_type || "UNKNOWN",

      assessmentInstance:
  String(
    r.assessment_instance ||
    r.assessment_type ||
    ""
  ).toUpperCase().trim(),

      supervisorRemark,
      studentResponse,
      status,

      updatedAt:
        r.cqi_updated_at || "",

      history:
        (r.student_response_history || "")
          .split("\n")
          .filter(Boolean)

    });

  });

});

/* FINAL PLO */
/* ================= ALL PLO ================= */

const allPLO = {};

Object.entries(grouped).forEach(([instance, rows]) => {

  const r = rows[0];

  allPLO[instance] = {};

  for (let i = 1; i <= 11; i++) {

    const rawValue = r[`plo${i}`];

    const v =
      rawValue === undefined ||
      rawValue === null ||
      rawValue === ""
        ? null
        : parseFloat(rawValue);

    allPLO[instance][`PLO${i}`] = {

      value:
        isNaN(v) ? null : v,

      status:
        v >= 4
          ? "Achieved"
          : v >= 3
          ? "Moderate"
          : v === null || isNaN(v)
          ? "Not Assessed"
          : "CQI Required"

    };
  }

});

/* ================= FINAL PLO ================= */

let finalPLO = {};

try {

  const finalRow = normalized.find(r =>
    String(r["matric"]).trim() === String(matric).trim() &&
    String(
      r["assessment_instance"] ||
      r["assessment_type"] ||
      ""
    ).toUpperCase().trim() === "FINAL"
  );

  console.log("🎯 FINAL ROW (STUDENT):", finalRow);

  if (finalRow) {

    for (let i = 1; i <= 11; i++) {

      const v = parseFloat(finalRow[`plo${i}`]);

      finalPLO[`PLO${i}`] = {

        value:
          isNaN(v) ? null : v,

        status:
          v >= 4
            ? "Achieved"
            : v >= 3
            ? "Moderate"
            : "CQI Required"

      };
    }

  }

} catch (err) {

  console.error("❌ FINAL PLO ERROR:", err);

  finalPLO = {};

}



/* ALERT */
const alerts = [];

remarks.forEach(r => {

  if (
    r.status === "PENDING" &&
    r.updatedAt
  ) {

    const days =
      (Date.now() - new Date(r.updatedAt)) /
      (1000 * 60 * 60 * 24);

    if (days > 7) {

      alerts.push({
        type: "CQI_PENDING",
        assessmentInstance: r.assessmentInstance,
        message:
          `${r.assessmentInstance} ignored > 7 days`
      });

    }
  }
});

    res.json({
  row: {
    ...profile,

    documents,
    timeline,

    cqiByAssessment,

    allPLO,      // ✅ NEW
    finalPLO,

    remarks,
    alerts
  }
});
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/* ================= MARK COMPLETED ================= */
/* ================= MARK COMPLETED ================= */
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

    const normalized = normalizeActivity(activity);

if (!normalized) {
  console.error("❌ Unknown activity:", activity);
  return res.status(400).json({ error: `Unknown activity: ${activity}` });
}

const column = ACTUAL_COLUMN_MAP[normalized];


    console.log("📝 Writing to column:", column);
    console.log("📍 Row:", idx + 2);
    console.log("📅 Date:", date);

    await writeSheetCell(
      process.env.SHEET_ID,
      "MasterTracking",
      column,
      idx + 2,
      date
    );

    await writeSheetCell(
  process.env.SHEET_ID,
  "MasterTracking",
  `${column}_STATUS`,
  idx + 2,
  "Pending Review"
);

await writeSheetCell(
  process.env.SHEET_ID,
  "MasterTracking",
  `${column}_REVIEWED_BY`,
  idx + 2,
  ""
);

await writeSheetCell(
  process.env.SHEET_ID,
  "MasterTracking",
  `${column}_REVIEWED_AT`,
  idx + 2,
  ""
);

    res.json({ success: true });

  } catch (e) {
    console.error("update-actual:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ================= RESET COMPLETED ================= */
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

       // ✅ NORMALIZE ACTIVITY
    const normalized = normalizeActivity(activity);

    if (!normalized) {
      console.error("❌ Unknown activity:", activity);
      return res.status(400).json({
        error: `Unknown activity: ${activity}`
      });
    }

    const column = ACTUAL_COLUMN_MAP[normalized];

    console.log("♻️ Resetting column:", column);

    await writeSheetCell(
      process.env.SHEET_ID,
      "MasterTracking",
      column,
      idx + 2,
      "" 
    );

    res.json({ success: true });

  } catch (e) {
    console.error("reset-actual:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ================= SAVE DOCUMENT ================= */
router.post("/save-document", auth, async (req, res) => {
  try {
    const {
  name,
  link
} = req.body;

const document_key = name;
const file_url = link;
    if (!document_key) {
      return res.status(400).json({
        error: "Missing document_key"
      });
    }

    const DOC_COLUMN_MAP = {
      "Development Plan & Learning Contract (DPLC)": "DPLC",
      "Student Supervision Logbook": "SUPERVISION_LOG",
      "Annual Progress Review – Year 1": "APR_Y1",
      "Annual Progress Review – Year 2": "APR_Y2",
      "Annual Progress Review – Year 3 (Final Year)": "APR_Y3",
    };

    const column = DOC_COLUMN_MAP[document_key];

    if (!column) {
      return res.status(400).json({
        error: `Invalid document key: ${document_key}`
      });
    }

    const email = req.user.email.toLowerCase();

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );

    if (idx === -1) {
      return res.status(404).json({
        error: "Student not found"
      });
    }

    await writeSheetCell(
      process.env.SHEET_ID,
      "MasterTracking",
      column,
      idx + 2,
      file_url || ""
    );

    await sendEmail({

  to:
    rows[idx][
      "Main Supervisor's Email"
    ],

  subject:
    `New Document Submitted - ${document_key}`,

  text: `
A student has submitted a document.

Student:
${rows[idx]["Student Name"]}

Document:
${document_key}

Please log into PPBMS to review.
`
});
    res.json({ success: true });

  } catch (e) {
    console.error("save-document:", e);

    res.status(500).json({
      error: e.message
    });
  }
});

/* ================= STUDENT RESPONSE (CQI) ================= */
router.post("/cqi/student-response", auth, async (req, res) => {
  try {

    const {
      matric,
      assessmentInstance,
      studentResponse,
      status
    } = req.body;

    const rows =
      await readASSESSMENT_PLO(process.env.SHEET_ID);

    /* 🔥 NORMALIZE KEYS */
    const normalized = rows.map(r => {
      const clean = {};
      Object.keys(r).forEach(k => {
        clean[
          k.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_")
        ] = r[k];
      });
      return clean;
    });

    /* 🔥 MATCH USING matric + assessment_instance ONLY */
    const matched = normalized
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => {

        const m = String(r["matric"] || "").trim();

        const instance = String(
          r["assessment_instance"] || ""
        )
          .toUpperCase()
          .trim();

        return (
          m === String(matric).trim() &&
          instance === assessmentInstance.toUpperCase().trim()
        );
      });

    console.log("📥 REQUEST:", { matric, assessmentInstance });
    console.log("🎯 MATCHED:", matched.length);

    if (matched.length === 0) {
      return res.status(404).json({
        error: "Assessment not found"
      });
    }

    for (const { r, i } of matched) {

      const rowNumber = i + 2;

      /* 🔥 SAVE RESPONSE */
      await writeSheetCell(
        process.env.SHEET_ID,
        "ASSESSMENT_PLO",
        "student_response",
        rowNumber,
        studentResponse
      );

      /* 🔥 APPEND HISTORY */
      const existing =
        r["student_response_history"] || "";

      const updated =
        existing +
        `\n[${new Date().toISOString()}] ${studentResponse}`;

      await writeSheetCell(
  process.env.SHEET_ID,
  "ASSESSMENT_PLO",
  "cqi_history",   // 🔥 FIX HERE
  rowNumber,
  updated
);

      /* 🔥 UPDATE STATUS */
      await writeSheetCell(
  process.env.SHEET_ID,
  "ASSESSMENT_PLO",
  "cqi_status",
  rowNumber,
  "RESPONDED"   // 🔥 FORCE UPDATE
);

      await writeSheetCell(
        process.env.SHEET_ID,
        "ASSESSMENT_PLO",
        "cqi_updated_at",
        rowNumber,
        new Date().toISOString()
      );
    }

    res.json({ success: true });

  } catch (e) {
    console.error("🔥 STUDENT RESPONSE ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
