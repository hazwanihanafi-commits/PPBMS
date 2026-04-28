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
import { sendEmail } from "../services/email.js";

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

      console.error(
        "students list error:",
        e
      );

      res.status(500).json({
        error: e.message
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

      Object.entries(
        DOC_COLUMN_MAP
      ).forEach(
        ([label, column]) => {

          const statusColumn =
            DOC_STATUS_MAP[
              label
            ];

          documents[label] = {

            url:
              raw[column] || "",

            status:
              raw[
                statusColumn
              ] ||
              (
                raw[column]
                  ? "Pending Review"
                  : "Not Submitted"
              ),

            feedback:
              raw[
                `${column}_FEEDBACK`
              ] || "",

            reviewed_by:
              raw[
                `${column}_REVIEWED_BY`
              ] || "",

            reviewed_at:
              raw[
                `${column}_REVIEWED_AT`
              ] || ""

          };
        }
      );

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

          return m === matric;
        });

      /* =========================================================
         GROUP BY ASSESSMENT INSTANCE
      ========================================================= */

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

      /* =========================================================
         CQI + REMARKS
      ========================================================= */

      const cqiByAssessment = {};
      const remarksByAssessment = [];

     Object.entries(grouped)
  .forEach(([instance, rows]) => {

    const ploScores =
      rows.map(r => {

        const o = {};

        for (
          let i = 1;
          i <= 11;
          i++
        ) {

          const rawValue =
            r[`plo${i}`];

          const v =
            rawValue === undefined ||
            rawValue === null ||
            rawValue === ""
              ? null
              : parseFloat(rawValue);

          o[`PLO${i}`] =
            isNaN(v)
              ? null
              : v;
        }

        return o;
      });

    console.log(
      "PLO SCORES:",
      ploScores
    );

    cqiByAssessment[instance] =
      deriveCQIByAssessment(
        ploScores
      );

    rows.forEach(r => {

  if (
    !r ||
    (
      !r.assessment_type &&
      !r.assessment_instance
    )
  ) {
    return;
  }

  remarksByAssessment.push({

    assessmentType:
      r.assessment_type || "UNKNOWN",

    assessmentInstance:
      r.assessment_instance ||
      r.assessment_type ||
      "UNKNOWN",

    remark:
      r.remarks || ""

  });

});
  });
      /* =========================================================
         FINAL PLO
      ========================================================= */

      const finalPLO =
        aggregateFinalPLO(
          cqiByAssessment
        );

      for (
        let i = 1;
        i <= 11;
        i++
      ) {

        const key = `PLO${i}`;

        if (!finalPLO[key]) {

          finalPLO[key] = {
            average: null,
            status:
              "Not Assessed"
          };
        }
      }

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
          remarksByAssessment
        }
      });

    } catch (e) {

      console.error(
        "student detail error:",
        e
      );

      res.status(500).json({
        error: e.message
      });
    }
  }
);

router.post(
  "/document-status",
  auth,
  async (req, res) => {

    try {

      const {
        studentEmail,
        document_key,
        status,
        feedback = ""
      } = req.body;

      console.log(
        "DOCUMENT STATUS UPDATE:",
        {
          studentEmail,
          document_key,
          status,
          feedback
        }
      );

      if (
        !studentEmail ||
        !document_key ||
        !status
      ) {
        return res.status(400).json({
          error: "Missing data"
        });
      }

      const baseColumn =
        DOC_COLUMN_MAP[document_key];

      if (!baseColumn) {
        return res.status(400).json({
          error: "Invalid document key"
        });
      }

      const rows =
        await readMasterTracking(
          process.env.SHEET_ID
        );

      const idx =
        rows.findIndex(
          r =>
            (
              r["Student's Email"] || ""
            )
              .toLowerCase()
              .trim() ===
            studentEmail
              .toLowerCase()
              .trim()
        );

      if (idx === -1) {
        return res.status(404).json({
          error: "Student not found"
        });
      }

      const rowNumber = idx + 2;

      await writeSheetCell(
        process.env.SHEET_ID,
        "MasterTracking",
        `${baseColumn}_STATUS`,
        rowNumber,
        status
      );

      await writeSheetCell(
        process.env.SHEET_ID,
        "MasterTracking",
        `${baseColumn}_FEEDBACK`,
        rowNumber,
        feedback
      );

      await writeSheetCell(
        process.env.SHEET_ID,
        "MasterTracking",
        `${baseColumn}_REVIEWED_BY`,
        rowNumber,
        req.user.email
      );

      await writeSheetCell(
        process.env.SHEET_ID,
        "MasterTracking",
        `${baseColumn}_REVIEWED_AT`,
        rowNumber,
        new Date().toISOString()
      );

      await sendEmail({

  to: studentEmail,

  subject:
    `Document Review Update - ${document_key}`,

  html: `
    <h2>Document Review Update</h2>

    <p>
      Document:
      ${document_key}
    </p>

    <p>
      Status:
      ${status}
    </p>

    <p>
      Feedback:
      ${feedback || "No feedback"}
    </p>

    <p>
      Please log into PPBMS.
    </p>
  `
});

      res.json({
        success: true
      });

    } catch (e) {

      console.error(
        "document-status error:",
        e
      );

      res.status(500).json({
        error: e.message
      });
    }
  }
);
export default router;
