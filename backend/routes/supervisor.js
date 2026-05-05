import express from "express";
import jwt from "jsonwebtoken";

import {
  readMasterTracking,
  readASSESSMENT_PLO,
  updateASSESSMENT_PLO_Remark,
  writeSheetCell
} from "../services/googleSheets.js";

import { buildTimelineForRow } from "../utils/buildTimeline.js";
import { deriveCQIByAssessment } from "../utils/cqiAggregate.js";
import { aggregateFinalPLO } from "../utils/finalPLOAggregate.js";
import sendEmail from "../services/sendEmail.js";
import { readSUPERVISOR_REMARKS } from "../services/googleSheets.js";

const router = express.Router();

/* =========================================================
   DOCUMENT COLUMN MAP
========================================================= */

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

const DOC_STATUS_MAP = {
  "Development Plan & Learning Contract (DPLC)":
    "DPLC_STATUS",

  "Student Supervision Logbook":
    "SUPERVISION_LOG_STATUS",

  "Annual Progress Review – Year 1":
    "APR_Y1_STATUS",

  "Annual Progress Review – Year 2":
    "APR_Y2_STATUS",

  "Annual Progress Review – Year 3 (Final Year)":
    "APR_Y3_STATUS",

  "Ethics Approval":
    "ETHICS_APPROVAL_STATUS",

  "Publication Acceptance":
    "PUBLICATION_ACCEPTANCE_STATUS",

  "Proof of Submission":
    "PROOF_OF_SUBMISSION_STATUS",

  "Conference Presentation":
    "CONFERENCE_PRESENTATION_STATUS",

  "Thesis Notice":
    "THESIS_NOTICE_STATUS",

  "Viva Report":
    "VIVA_REPORT_STATUS",

  "Correction Verification":
    "CORRECTION_VERIFICATION_STATUS",

  "Final Thesis":
    "FINAL_THESIS_STATUS",
};

/* =========================================================
   AUTH
========================================================= */

function auth(req, res, next) {

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

    if (
      !["admin", "supervisor"]
        .includes(user.role)
    ) {
      return res.status(401).json({
        error: "Unauthorized"
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

/* =========================================================
   GET STUDENTS
========================================================= */

router.get(
  "/students",
  auth,
  async (req, res) => {

    try {

      const rows =
        await readMasterTracking(
          process.env.SHEET_ID
        );

      const loginEmail =
        (
          req.user.email || ""
        )
          .toLowerCase()
          .trim();

      const students = rows
        .filter(r =>
          req.user.role === "admin"
            ? true
            : (
                r[
                  "Main Supervisor's Email"
                ] || ""
              )
                .toLowerCase()
                .trim() === loginEmail
        )
        .map(r => {

          const timeline =
            buildTimelineForRow(r);

          const completed =
            timeline.filter(
              t =>
                t.status
                  ?.trim()
                  .toLowerCase() ===
                "completed"
            ).length;

          return {

            id:
              r["Matric"] || "",

            name:
              r["Student Name"] || "",

            email:
              (
                r[
                  "Student's Email"
                ] || ""
              )
                .toLowerCase()
                .trim(),

            programme:
              r["Programme"] || "",

            field:
              r["Field"] || "",

            status:
              r["Status"] ||
              "Active",

            coSupervisors:
              r[
                "Co-Supervisor(s)"
              ] || "",

            progressPercent:
              timeline.length
                ? Math.round(
                    (
                      completed /
                      timeline.length
                    ) * 100
                  )
                : 0
          };
        });

      res.json({ students });

    } catch (e) {
  console.error("🔥 STUDENT API CRASH:", e);

  return res.status(500).json({
    error: "student api failed",
    message: e.message,
    stack: e.stack
  });
}
  }
);

/* =========================================================
   GET STUDENT DETAIL
========================================================= */

router.get(
  "/student/:email",
  auth,
  async (req, res) => {

    try {

      const email =
        req.params.email
          .toLowerCase()
          .trim();

      const rows =
        await readMasterTracking(
          process.env.SHEET_ID
        );

      const raw = rows.find(
        r =>
          (
            r[
              "Student's Email"
            ] || ""
          )
            .toLowerCase()
            .trim() === email
      );

      if (!raw) {
        return res.status(404).json({
          error:
            "Student not found"
        });
      }

      const rawCoSup =
        raw[
          "Co-Supervisor(s)"
        ] || "";

      const coSupervisors =
        rawCoSup
          ? rawCoSup
              .split(/\d+\.\s*/g)
              .map(s => s.trim())
              .filter(Boolean)
          : [];

      const profile = {

        student_id:
          raw["Matric"] || "",

        student_name:
          raw["Student Name"] || "",

        email,

        programme:
          raw["Programme"] || "",

        field:
          raw["Field"] || "",

        department:
          raw["Department"] || "",

        status:
          raw["Status"] ||
          "Active",

        supervisor:
          raw[
            "Main Supervisor"
          ] || "",

        supervisor_email:
          raw[
            "Main Supervisor's Email"
          ] || "",

        coSupervisors
      };



      /* =========================================================
   DOCUMENTS
========================================================= */

const documents = {};

Object.entries(DOC_COLUMN_MAP).forEach(([label, column]) => {

  const statusColumn = DOC_STATUS_MAP[label];

  documents[label] = {
    url: raw[column] || "",

    status:
      raw[statusColumn] ||
      (raw[column] ? "Pending Review" : "Not Submitted"),

    feedback:
      raw[`${column}_FEEDBACK`] || "",

    reviewed_by:
      raw[`${column}_REVIEWED_BY`] || "",

    reviewed_at:
      raw[`${column}_REVIEWED_AT`] || ""
  };

});



      /* =========================================================
         TIMELINE
      ========================================================= */

      const timeline =
        buildTimelineForRow(raw);

      /* =========================================================
         READ ASSESSMENT_PLO
      ========================================================= */

      const assessmentRows =
        await readASSESSMENT_PLO(
          process.env.SHEET_ID
        );

      const normalized =
        assessmentRows.map(r => {

          const clean = {};

          Object.keys(r)
            .forEach(k => {

              clean[
  k
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
] = r[k];
            });

          return clean;
        });

      const matric =
        String(
          raw["Matric"] || ""
        ).trim();

      const studentRows =
        normalized.filter(r => {

          const m =
            String(
              r["matric"] ||
              r["matricno"] ||
              ""
            ).trim();

          return m.toString().trim().toLowerCase() ===
       matric.toString().trim().toLowerCase();
        });
      console.log("MAT:", matric);
console.log("FOUND:", studentRows.length);
console.log("SAMPLE:", normalized[0]);

      /* =========================================================
         GROUP BY ASSESSMENT INSTANCE
      ========================================================= */

      const grouped = {};

studentRows.forEach(r => {

  const key =
    (r["assessment_instance"] ||
     r["assessment_type"] ||
     "")
      .toString()
      .trim()
      .toUpperCase();

  if (!grouped[key]) {
    grouped[key] = [];
  }

  grouped[key].push(r);

});

      /* =========================================================
         CQI + REMARKS
      ========================================================= */

      /* =========================================================
   CQI + REMARKS (UPGRADED)
========================================================= */
const cqiByAssessment = {};
const remarksByAssessment = [];

Object.entries(grouped || {})
  .forEach(([instance, rows]) => {

     if (!rows || !Array.isArray(rows)) return; 

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

    try {

  const validScores = ploScores.map(p => {

    const clean = {};

    Object.keys(p).forEach(k => {
      clean[k] =
        typeof p[k] === "number"
          ? p[k]
          : 0;   // ✅ replace null with 0
    });

    return clean;
  });

  cqiByAssessment[instance] =
    deriveCQIByAssessment(validScores);

} catch (err) {

  console.error("⚠️ CQI CALC ERROR:", err, instance);

  cqiByAssessment[instance] = {};
}

    rows.forEach(r => {

  try {

    if (
      !r ||
      (!r.assessment_type && !r.assessment_instance)
    ) return;

    const instanceKey = String(
  r["assessment_instance"] ||
  r["assessment_type"] ||
  ""
)
  .toUpperCase()
  .trim();

if (!instanceKey) return; // ✅ skip bad row
    
    let safeDate = null;

try {
  if (r["cqi_updated_at"]) {
    const d = new Date(r["cqi_updated_at"]);
    if (!isNaN(d.getTime())) {
      safeDate = d.toISOString();
    }
  }
} catch (e) {
  safeDate = null;
}

    remarksByAssessment.push({

      assessmentType:
        r["assessment_type"] || "UNKNOWN",

      assessmentInstance:
        instanceKey,

      remark: "",

      supervisorRemark:
        r["supervisor_remark"] || "",

      studentResponse:
        r["student_response"] || "",

      status:
        r["cqi_status"] ||
        (r["student_response"]
          ? "RESPONDED"
          : "PENDING"),

      updatedAt: safeDate

    });

  } catch (err) {
    console.error("⚠️ CQI ROW ERROR:", err, r);
  }

});

  });  // ✅ THIS LINE WAS MISSING

/* =========================================================
   FINAL PLO
========================================================= */
/* =========================================================
   FINAL PLO
========================================================= */

let finalPLO = {};

try {
  finalPLO = aggregateFinalPLO(cqiByAssessment || {});
} catch (err) {
  console.error("⚠️ FINAL PLO ERROR:", err);
  finalPLO = {};
}

for (let i = 1; i <= 11; i++) {

  const key = `PLO${i}`;

  if (!finalPLO[key]) {
    finalPLO[key] = {
      average: null,
      status: "Not Assessed"
    };
  }
}

/* =========================================================
   CQI AUTO ALERT
========================================================= */

const alerts = [];

remarksByAssessment.forEach(r => {

  if (
  r.supervisorRemark &&
  !r.studentResponse &&
  r.updatedAt &&
  !isNaN(new Date(r.updatedAt))
) {

  const days =
    (Date.now() - new Date(r.updatedAt).getTime()) /
    (1000 * 60 * 60 * 24);

  if (days > 7) {
    alerts.push({
      type: "CQI_PENDING",
      assessmentInstance: r.assessmentInstance,
      message: `${r.assessmentInstance} ignored > 7 days`
    });
  }
}
});

/* =========================================================
   RESPONSE
========================================================= */

res.json({
  row: {
    ...profile,
    documents,
    timeline,
    cqiByAssessment,
    finalPLO,
    remarksByAssessment,
    alerts
  }
});

} catch (e) {

  console.error("student detail error:", e);

  res.status(500).json({
    error: e.message
  });
}
});

/* =========================================================
   DOCUMENT STATUS UPDATE
========================================================= */

router.post("/document-status", auth, async (req, res) => {
  try {
    const { studentEmail, documentName, status, feedback } = req.body;

    // ✅ ADD THIS SAFETY CHECK
    if (!studentEmail || !documentName || !status) {
      return res.status(400).json({
        error: "Missing required fields",
        body: req.body
      });
    }

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const index = rows.findIndex(
      r =>
        (r["Student's Email"] || "")
          .toLowerCase()
          .trim() === studentEmail.toLowerCase().trim()
    );

    if (index === -1) {
      return res.status(404).json({ error: "Student not found" });
    }

    const rowNumber = index + 2;

    const statusColumn = DOC_STATUS_MAP[documentName];
    const column = DOC_COLUMN_MAP[documentName];

    if (!statusColumn || !column) {
      return res.status(400).json({ error: "Invalid document name" });
    }

    // ✅ update status
    await writeSheetCell(
      process.env.SHEET_ID,
      "MasterTracking",
      statusColumn,
      rowNumber,
      status
    );

    // ✅ update feedback
    if (feedback !== undefined) {
      await writeSheetCell(
        process.env.SHEET_ID,
        "MasterTracking",
        `${column}_FEEDBACK`,
        rowNumber,
        feedback
      );
    }

    // ✅ reviewer info
    await writeSheetCell(
      process.env.SHEET_ID,
      "MasterTracking",
      `${column}_REVIEWED_BY`,
      rowNumber,
      req.user.email
    );

    await writeSheetCell(
      process.env.SHEET_ID,
      "MasterTracking",
      `${column}_REVIEWED_AT`,
      rowNumber,
      new Date().toISOString()
    );

    res.json({ success: true });

  } catch (e) {
    console.error("document-status error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* =========================================================
   SUPERVISOR ADD REMARK
========================================================= */

router.post(
  "/cqi/supervisor-remark",
  auth,
  async (req, res) => {

    try {

      const {
        matric,   // ✅ use matric now
        assessmentInstance,
        supervisorRemark
      } = req.body;

      const rows =
        await readASSESSMENT_PLO(
          process.env.SHEET_ID
        );

      const matched = rows
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => {

          const m = String(r["Matric"] || "").trim();

          const instance = String(
            r["assessment_instance"] ||
            r["assessment_type"] ||
            ""
          )
            .toUpperCase()
            .trim();

          return (
            m === String(matric).trim() &&
            instance === assessmentInstance.toUpperCase().trim()
          );
        });

      if (matched.length === 0) {
        console.log("❌ NO MATCH FOUND", { matric, assessmentInstance });
        return res.status(404).json({
          error: "Assessment not found"
        });
      }

      for (const { i } of matched) {

        const rowNumber = i + 2;

        console.log("✅ WRITING TO ROW:", rowNumber);

        await writeSheetCell(
          process.env.SHEET_ID,
          "ASSESSMENT_PLO",
          "Supervisor_Remark",
          rowNumber,
          supervisorRemark
        );

        await writeSheetCell(
          process.env.SHEET_ID,
          "ASSESSMENT_PLO",
          "cqi_status",
          rowNumber,
          "PENDING"
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
      console.error("🔥 SAVE ERROR:", e);
      res.status(500).json({ error: e.message });
    }
  }
);



export default router;
