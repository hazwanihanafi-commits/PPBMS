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

    res.json({ row: { ...profile, documents, timeline } });
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

export default router;
